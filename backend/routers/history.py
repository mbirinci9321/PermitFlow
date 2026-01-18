from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import ActionLog
from ..schemas import ActionLogBase
# from ..modules.transaction import TransactionManager (Mocking for now)

router = APIRouter(
    prefix="/history",
    tags=["history"],
    responses={404: {"description": "Not found"}},
)

@router.get("", response_model=List[ActionLogBase])
@router.get("/", response_model=List[ActionLogBase])
def get_history(db: Session = Depends(get_db)):
    # Order by timestamp desc
    return db.query(ActionLog).order_by(ActionLog.timestamp.desc()).all()

@router.post("/{action_id}/rollback")
@router.post("/{action_id}/rollback/")
def rollback_action(action_id: int, db: Session = Depends(get_db)):
    # Mocking Rollback Logic for now as TransactionManager is not fully implemented in the tools available
    action = db.query(ActionLog).filter(ActionLog.id == action_id).first()
    if action:
        action.status = "rolled_back"
        db.commit()
        return {"status": "rolled_back", "id": action_id}
    return {"status": "failed", "error": "Action not found"}
