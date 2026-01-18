from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Folder, ADGroup
from typing import List

router = APIRouter(
    prefix="/search",
    tags=["inventory"],
    responses={404: {"description": "Not found"}},
)

@router.get("")
@router.get("/")
def search_inventory(q: str, db: Session = Depends(get_db)):
    if not q:
        return []
        
    # Simple search implementation
    folders = db.query(Folder).filter(Folder.path.contains(q)).all()
    groups = db.query(ADGroup).filter(ADGroup.name.contains(q)).all()
    
    results = []
    
    for f in folders:
        # Mock finding associated groups for the folder
        local_groups = [f"ACL_{f.path.split('\\')[-1]}_R", f"ACL_{f.path.split('\\')[-1]}_RW"]
        
        results.append({
            "id": f.id,
            "type": "folder",
            "name": f.path.split('\\')[-1] if '\\' in f.path else f.path, 
            "path": f.path,
            "server": f.server,
            "groups": local_groups 
        })
        
    for g in groups:
        results.append({
            "id": g.id,
            "type": "group",
            "name": g.name,
            "description": f"AD Group ({g.type})"
        })
        
    return results
