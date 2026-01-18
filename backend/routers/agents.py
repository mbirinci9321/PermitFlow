from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Agent
from ..schemas import AgentBase
from ..websocket_manager import manager
from datetime import datetime
from typing import List
import json

router = APIRouter(
    prefix="/agents",
    tags=["agents"],
    responses={404: {"description": "Not found"}},
)

@router.get("", response_model=List[AgentBase])
@router.get("/", response_model=List[AgentBase])
def get_agents(db: Session = Depends(get_db)):
    return db.query(Agent).all()

@router.post("/{agent_id}/scan")
async def scan_agent_shares(agent_id: str, db: Session = Depends(get_db)):
    import uuid
    import asyncio
    
    if agent_id not in manager.active_connections:
        return {"status": "failed", "error": "Agent not connected"}
        
    req_id = str(uuid.uuid4())
    future = manager.create_request(req_id)
    
    await manager.send_personal_message({
        "type": "list_shares",
        "request_id": req_id
    }, agent_id)
    
    try:
        response = await asyncio.wait_for(future, timeout=10.0)
        result = response.get("result", {})
        if result.get("status") == "success":
            shares = result.get("shares", [])
            
            # Save to Database
            from ..models import Folder
            for share in shares:
                name = share.get("Name")
                path = share.get("Path")
                
                # Check if already exists
                exists = db.query(Folder).filter(Folder.server == agent_id, Folder.path == path).first()
                if not exists:
                    folder = Folder(
                        path=path,
                        server=agent_id,
                        # We don't have an action_id for discovered folders
                    )
                    db.add(folder)
            
            db.commit()
            return {"status": "success", "count": len(shares), "shares": shares}
        return {"status": "failed", "error": result.get("error", "Unknown error")}
    except asyncio.TimeoutError:
        return {"status": "failed", "error": "Timeout waiting for agent"}
    except Exception as e:
        return {"status": "failed", "error": str(e)}

@router.websocket("/ws/{agent_id}")
async def websocket_endpoint(websocket: WebSocket, agent_id: str, db: Session = Depends(get_db)):
    print(f"[WS] Connection attempt from agent: {agent_id}")
    await manager.connect(agent_id, websocket)
    
    # Update Agent Status in DB
    agent_record = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent_record:
        agent_record = Agent(id=agent_id, hostname=agent_id, status="online", last_heartbeat=datetime.utcnow())
        db.add(agent_record)
    else:
        agent_record.status = "online"
        agent_record.last_heartbeat = datetime.utcnow()
    db.commit()

    try:
        while True:
            # Receive Heartbeat or Responses from Agent
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "heartbeat":
                # Update heartbeat
                agent_record = db.query(Agent).filter(Agent.id == agent_id).first()
                if agent_record:
                    agent_record.last_heartbeat = datetime.utcnow()
                    agent_record.status = "online"
                    db.commit()
            
            elif message.get("type") == "response":
                # Handle Command Response (Resolve Futures)
                original = message.get("original_command", {})
                req_id = original.get("request_id")
                if req_id:
                    manager.resolve_request(req_id, message)
            
            print(f"Received from {agent_id}: {message}")

    except WebSocketDisconnect:
        manager.disconnect(agent_id)
        # Mark offline
        agent_record = db.query(Agent).filter(Agent.id == agent_id).first()
        if agent_record:
            # Only mark offline if it was this specific connection (simple check)
            agent_record.status = "offline"
            db.commit()
