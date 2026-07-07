import os
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from sqlalchemy.sql import func
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

POSTGRES_URI = os.getenv("POSTGRES_URI", "sqlite:///./local_db.sqlite") # Fallback to sqlite if postgres not found

# Configure SQLAlchemy Engine
# For supabase, pool_pre_ping is important to avoid closed connection errors
engine = create_engine(POSTGRES_URI, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    picture = Column(String, nullable=True)
    
    # OAuth specific
    google_id = Column(String, unique=True, index=True, nullable=True)
    
    # Password auth (optional if only using google)
    hashed_password = Column(String, nullable=True)
    otp_code = Column(String, nullable=True)
    otp_expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # SMTP credentials (Encrypted)
    smtp_host = Column(String, nullable=True)
    smtp_port = Column(Integer, nullable=True)
    smtp_username = Column(String, nullable=True)
    smtp_password_encrypted = Column(String, nullable=True) # Stored encrypted!
    smtp_from_email = Column(String, nullable=True)
    smtp_from_name = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    campaigns = relationship("Campaign", back_populates="owner")

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(String, primary_key=True, index=True) # UUID string
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    name = Column(String, nullable=False)
    product_name = Column(String, nullable=False)
    product_description = Column(Text, nullable=False)
    target_audience = Column(Text, nullable=False)
    tone_of_voice = Column(String, default="Professional")
    status = Column(String, default="active") # active, paused, completed
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="campaigns")

class Note(Base):
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Making nullable to allow unauth notes if needed
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String, nullable=False)
    status = Column(String, default="pending")
    due_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

def init_db():
    """Create tables if they don't exist"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("PostgreSQL Database tables created successfully.")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")

def get_db():
    """Dependency for FastAPI endpoints"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
