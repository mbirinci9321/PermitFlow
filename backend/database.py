from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

import os

# Determine App Data Directory
app_name = "PermitFlow"
if os.name == 'nt':
    app_data = os.getenv('APPDATA')
else:
    app_data = os.path.expanduser("~/.local/share")

data_dir = os.path.join(app_data, app_name)
if not os.path.exists(data_dir):
    os.makedirs(data_dir, exist_ok=True)

SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(data_dir, 'master_v3.db')}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
