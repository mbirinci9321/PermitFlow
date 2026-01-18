from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Setting
from pydantic import BaseModel
from typing import List, Optional

from ..schemas import SettingBase

router = APIRouter(
    prefix="/settings",
    tags=["settings"],
    responses={404: {"description": "Not found"}},
)

@router.get("", response_model=List[SettingBase])
@router.get("/", response_model=List[SettingBase])
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(Setting).all()
    # Ensure default settings exist if empty
    if not settings:
        defaults = [
            ("ad_server", "", "Active Directory Server IP/Hostname"),
            ("ad_domain", "", "Active Directory Domain (e.g. corp.local)"),
            ("ad_user", "", "AD Service Account Username"),
            ("ad_password", "", "AD Service Account Password"),
            ("mock_mode", "true", "Enable Mock Mode (Simulate operations)"),
            ("agent_install_path", "C:\\PermitFlowAgent", "Default install path for agents")
        ]
        results = []
        for key, val, desc in defaults:
            s = Setting(key=key, value=val, description=desc)
            db.add(s)
            results.append(s)
        db.commit()
        return results
        
    return settings

@router.post("")
@router.post("/", response_model=SettingBase)
def update_setting(setting: SettingBase, db: Session = Depends(get_db)):
    db_setting = db.query(Setting).filter(Setting.key == setting.key).first()
    if db_setting:
        db_setting.value = setting.value
        if setting.description:
            db_setting.description = setting.description
    else:
        db_setting = Setting(key=setting.key, value=setting.value, description=setting.description)
        db.add(db_setting)
    
    db.commit()
    db.refresh(db_setting)
    return db_setting
