from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..database import get_db
from ..models import Agent
from ..services.ad_service import ADService
import shutil
import psutil

router = APIRouter(
    prefix="/health",
    tags=["health"],
    responses={404: {"description": "Not found"}},
)

@router.get("")
@router.get("/")
def get_system_health(db: Session = Depends(get_db)):
    health_status = {
        "database": "unknown",
        "ad_connection": "unknown",
        "agents_online": 0,
        "agents_total": 0,
        "disk_space": "unknown",
        "system_status": "healthy" 
    }
    
    # 1. Check Database
    try:
        db.execute(text("SELECT 1"))
        health_status["database"] = "connected"
    except Exception as e:
        health_status["database"] = "error"
        health_status["system_status"] = "degraded"

    # 2. Check Agents
    try:
        agents = db.query(Agent).all()
        health_status["agents_total"] = len(agents)
        health_status["agents_online"] = len([a for a in agents if a.status == 'online'])
    except:
        health_status["system_status"] = "degraded"

    # 3. Check AD Service
    ad = ADService(db)
    # Simple check if Mock or Real
    if ad.is_mock():
        health_status["ad_connection"] = "mock_mode"
    else:
        # Pinging real AD would go here
        health_status["ad_connection"] = "configured_real"

    # 4. Disk Space (where the app is running)
    try:
        total, used, free = shutil.disk_usage("/")
        health_status["disk_space"] = f"{free // (2**30)} GB Free"
    except:
        pass

    return health_status
