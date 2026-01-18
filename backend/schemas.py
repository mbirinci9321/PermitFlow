from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class AgentBase(BaseModel):
    id: str
    hostname: str
    ip_address: Optional[str] = None
    status: str
    last_heartbeat: datetime

    class Config:
        from_attributes = True

class FolderBase(BaseModel):
    id: int
    path: str
    server: str
    
    class Config:
        from_attributes = True

class GroupBase(BaseModel):
    id: int
    name: str
    type: str

    class Config:
        from_attributes = True

class SettingBase(BaseModel):
    key: str
    value: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class ActionLogBase(BaseModel):
    id: int
    timestamp: datetime
    description: str
    status: str

    class Config:
        from_attributes = True
