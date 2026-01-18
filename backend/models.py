from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Agent(Base):
    __tablename__ = "agents"

    id = Column(String, primary_key=True, index=True) # Machine Name or UUID
    hostname = Column(String, unique=True, index=True)
    ip_address = Column(String)
    status = Column(String, default="offline") # online, offline
    last_heartbeat = Column(DateTime, default=datetime.utcnow)

class ActionLog(Base):
    __tablename__ = "actions"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    action_type = Column(String) # Provision, Rollback
    description = Column(String)
    status = Column(String) # success, failed, rolled_back
    
    # Relationships to items created in this transaction
    created_folders = relationship("Folder", back_populates="action")
    created_groups = relationship("ADGroup", back_populates="action")

class Folder(Base):
    __tablename__ = "folders"

    id = Column(Integer, primary_key=True, index=True)
    path = Column(String, index=True)
    server = Column(String) # Refers to Agent Hostname
    action_id = Column(Integer, ForeignKey("actions.id"))
    
    action = relationship("ActionLog", back_populates="created_folders")

class ADGroup(Base):
    __tablename__ = "ad_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    type = Column(String) # Read, Modify
    action_id = Column(Integer, ForeignKey("actions.id"))

    action = relationship("ActionLog", back_populates="created_groups")

class Setting(Base):
    __tablename__ = "settings"

    key = Column(String, primary_key=True, index=True)
    value = Column(String)
    description = Column(String, nullable=True)
