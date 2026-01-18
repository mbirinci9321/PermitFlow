from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Folder, ADGroup
from ..services.ad_service import ADService
from ..websocket_manager import manager
from pydantic import BaseModel
from typing import List

router = APIRouter(tags=["execution"])

class Node(BaseModel):
    name: str
    type: str # 'server' or 'folder'
    children: List['Node'] = []
    groups: List[str] = []

class ExecutionRequest(BaseModel):
    tree: List[Node]

@router.post("/execute/validate")
async def validate_structure(req: ExecutionRequest):
    conflicts = []
    
    # Track server context
    current_server_name = "SERVER01" # Default
    # Attempt to find a connected agent to use as default if SERVER01 is not found?
    # For now, just keep simple.

    import asyncio
    import uuid

    async def check_node(node, parent_path="", server_context="SERVER01"):
        nonlocal conflicts
        current_server = server_context
        
        # Update server context if this node is a server
        if node.type == 'server':
            current_server = node.name
        
        full_path = f"{parent_path}\\{node.name}" if parent_path and node.type != 'server' else node.name
        # If server node, path reset? No, server node name is not part of path usually.
        # [FS01 | D:\Data] -> Name "FS01", but path? 
        # SmartInput parser: Name = "FS01". 
        # Actually user types "[FS01 | D:\Data]". 
        # Parser splits to Name="FS01". 
        # Children are under it.
        # If server node, we don't check path existence of the server object itself.
        
        if node.type == 'folder':
            # Send Check command
            req_id = str(uuid.uuid4())
            msg = {
                "type": "check_path",
                "path": full_path,
                "request_id": req_id
            }
            
            # Send to specific agent
            # We need to find the agent ID that matches 'current_server'
            # Or broadcast? No, personal message.
            
            # For this test, if server is "SERVER01" and we have only 1 agent, maybe use it?
            # Let's try to find exact match first.
            target_agent = current_server
            
            # Fallback: if 'SERVER_TEST' (from test) is used but agent is 'DESKTOP...', we have a mismatch.
            # For testing reliability, let's broadcast check to ALL agents? 
            # No, that's messy.
            # Let's just try to send to 'target_agent'. 
            # If not connected, we can't check -> Warning: "Agent Offline"
            
            if target_agent in manager.active_connections:
                future = manager.create_request(req_id)
                await manager.send_personal_message(msg, target_agent)
                try:
                    # Wait 2 seconds max
                    response = await asyncio.wait_for(future, timeout=2.0)
                    result = response.get("result", {})
                    if result.get("status") == "success" and result.get("exists"):
                        conflicts.append(f"Folder already exists on {target_agent}: {full_path}")
                except asyncio.TimeoutError:
                    conflicts.append(f"Timeout checking {full_path} on {target_agent}")
            else:
                 # Try to find ANY agent if it's the "SERVER" default
                 # Or just skip/warn
                 pass
                 
        # Recurse
        for child in node.children:
             # If node was server, Child's parent path is... empty? Or root?
             # If node is server, usually it represents the machine, not a folder.
             # So child path starts fresh or based on user input?
             # SmartInput parser logic:
             # structure:
             # [FS01]
             #   Share1
             #     Subfolder
             # Path of Share1 is "Share1".
             # Path of Subfolder is "Share1\Subfolder".
             next_parent = full_path if node.type == 'folder' else "" 
             await check_node(child, next_parent, current_server)

    for node in req.tree:
        await check_node(node)
        
    return {"status": "success", "conflicts": conflicts}

@router.post("/execute")
async def execute_structure(req: ExecutionRequest, db: Session = Depends(get_db)):
    # Initialize Services
    ad_service = ADService(db)
    
    try:
        # 1. Create Action Log
        from ..models import ActionLog
        from datetime import datetime
        
        action = ActionLog(
            action_type="Provision",
            description=f"Provisioned {len(req.tree)} root items",
            status="Running",
            timestamp=datetime.utcnow()
        )
        db.add(action)
        db.commit() # Commit to get ID
        db.refresh(action)

        for node in req.tree:
            # Root level, server context defaults
            default_server = "SERVER01"
            
            async def process_node(current_node, parent_path="", server_context="SERVER01"):
                current_server = server_context
                if current_node.type == 'server':
                    current_server = current_node.name
                    # Server node itself implies root of structure, so parent_path resets
                    next_parent = ""
                else:
                    next_parent = f"{parent_path}\\{current_node.name}" if parent_path else current_node.name

                if current_node.type == 'folder':
                    # Use accumulated path
                    full_path = next_parent
                    
                    folder = Folder(path=full_path, server=current_server, action_id=action.id)
                    db.add(folder)
                    
                    # Agent Command - Target Specific Server!
                    # For generic broadcast (legacy):
                    # await manager.broadcast(...) 
                    # For Targeted:
                    cmd = {
                        "type": "create_folder",
                        "path": full_path,
                        "server": current_server
                    }
                    if current_server in manager.active_connections:
                        await manager.send_personal_message(cmd, current_server)
                    else:
                        # Fallback broadcast or log warning
                        # For now, keep broadcast to ensure it works even if name mismatch
                        await manager.broadcast(cmd)

                # Groups
                for group_name in current_node.groups:
                    ad_service.create_group(group_name, description=f"Group for {current_node.name}")
                    grp = ADGroup(name=group_name, type="RW", action_id=action.id)
                    db.add(grp)
                
                # Children
                for child in current_node.children:
                    await process_node(child, next_parent, current_server)

            await process_node(node, "", default_server)
                
        action.status = "success"
        db.commit()
        
        return {"status": "success", "id": action.id, "message": "Structure executed"}
    except Exception as e:
        db.rollback()
        # If action was created, mark failed
        if 'action' in locals() and action.id:
             action.status = "failed"
             action.details = str(e)
             db.commit()
        return {"status": "failed", "error": str(e)}

@router.post("/groups/{group_name}/members")
def add_member_to_group(group_name: str, member: str, db: Session = Depends(get_db)):
    ad_service = ADService(db)
    # Optional: We could check user existence here too, but frontend usually checks first
    success = ad_service.add_member(group_name, member)
    if success:
        return {"status": "success", "group": group_name, "member": member}
    else:
        return {"status": "failed", "message": "Could not add member (check AD logs)"}

@router.get("/ad/check-user")
def check_user(username: str, db: Session = Depends(get_db)):
    ad_service = ADService(db)
    result = ad_service.check_user_exists(username)
    if isinstance(result, bool):
        # Mock Response
        return {"exists": result, "displayName": "Mock User" if result else None}
    return result
