from __future__ import annotations
import os
import hashlib
import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
import requests
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from config.env_loader import load_project_env
from memory.postgres_client import get_db, User, Base, engine

load_project_env()

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-key-change-in-production")
ALGORITHM = "HS256"
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "super-secret-admin-key")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@vetrex.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

SMTP_EMAIL = os.getenv("SMTP_EMAIL", os.getenv("SMTP_USERNAME", ""))
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", SMTP_EMAIL)
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "RGTVetrex")

auth_router = APIRouter(prefix="/auth", tags=["auth"])

class GoogleLoginRequest(BaseModel):
    token: str

class AuthRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str = ""

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str

class AdminCreateUserRequest(BaseModel):
    email: str
    name: str = ""

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

def hash_password(password: str) -> str:
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return salt.hex() + ":" + key.hex()

def verify_password(password: str, hashed: str) -> bool:
    if not hashed or ":" not in hashed:
        return False
    try:
        salt_hex, key_hex = hashed.split(":")
        salt = bytes.fromhex(salt_hex)
        key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
        return key.hex() == key_hex
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def send_otp_email(to_email: str, otp: str):
    smtp_email = os.getenv("SMTP_EMAIL", os.getenv("SMTP_USERNAME", ""))
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_from_email = os.getenv("SMTP_FROM_EMAIL", smtp_email)
    smtp_from_name = os.getenv("SMTP_FROM_NAME", "RGTVetrex")

    if not smtp_email or not smtp_password:
        print(f"MOCK EMAIL: OTP for {to_email} is {otp}")
        return

    msg = MIMEMultipart()
    msg['From'] = f"{smtp_from_name} <{smtp_from_email}>"
    msg['To'] = to_email
    msg['Subject'] = "Your Password Reset OTP"
    
    body = f"Hello,\n\nYour OTP for resetting your password is: {otp}\n\nThis OTP is valid for 10 minutes.\n\nThanks,\n{smtp_from_name} Team"
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_email, smtp_password)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print(f"Error sending email: {e}")
        # Still print to console so dev isn't blocked if SMTP fails
        print(f"MOCK EMAIL FALLBACK: OTP for {to_email} is {otp}")

def send_credentials_email(to_email: str, password: str, name: str):
    smtp_email = os.getenv("SMTP_EMAIL", os.getenv("SMTP_USERNAME", ""))
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_from_email = os.getenv("SMTP_FROM_EMAIL", smtp_email)
    smtp_from_name = os.getenv("SMTP_FROM_NAME", "RGTVetrex")

    if not smtp_email or not smtp_password:
        print(f"MOCK EMAIL: Credentials for {to_email} - Password: {password}")
        return

    msg = MIMEMultipart()
    msg['From'] = f"{smtp_from_name} <{smtp_from_email}>"
    msg['To'] = to_email
    msg['Subject'] = "Your RGTVetrex Dashboard Credentials"
    
    body = f"Hello {name},\n\nYour account for the RGTVetrex Dashboard has been created.\n\nHere are your login credentials:\nEmail: {to_email}\nPassword: {password}\n\nPlease login and change your password.\n\nThanks,\n{smtp_from_name} Team"
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_email, smtp_password)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print(f"Error sending email: {e}")
        print(f"MOCK EMAIL FALLBACK: Credentials for {to_email} - Password: {password}")

def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role", "user")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
        if role == "admin" and user_id == "admin":
            return User(id=0, email=ADMIN_EMAIL, name="Super Admin")
            
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    user = db.query(User).filter(User.id == str(user_id)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
        
    return user

@auth_router.post("/register", response_model=TokenResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    new_user = User(
        email=request.email,
        name=request.name,
        hashed_password=hash_password(request.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(new_user.id)}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"id": new_user.id, "email": new_user.email, "name": new_user.name}
    }

@auth_router.post("/login", response_model=TokenResponse)
def login(request: AuthRequest, db: Session = Depends(get_db)):
    if request.email == ADMIN_EMAIL and request.password == ADMIN_PASSWORD:
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": "admin", "role": "admin"}, expires_delta=access_token_expires
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {"id": 0, "email": ADMIN_EMAIL, "name": "Super Admin", "role": "admin"}
        }

    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"id": user.id, "email": user.email, "name": user.name}
    }

@auth_router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # Don't leak whether email exists
        return {"message": "If the email exists, an OTP has been sent."}
        
    otp = ''.join(random.choices(string.digits, k=6))
    user.otp_code = otp
    user.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.commit()
    
    send_otp_email(user.email, otp)
    return {"message": "If the email exists, an OTP has been sent."}

@auth_router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not user.otp_code or user.otp_code != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    if user.otp_expires_at and user.otp_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP expired")
        
    if verify_password(request.new_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="New password must be different from your current password")
        
    user.hashed_password = hash_password(request.new_password)
    user.otp_code = None
    user.otp_expires_at = None
    db.commit()
    
    return {"message": "Password reset successfully"}

@auth_router.post("/google/login", response_model=TokenResponse)
def google_login(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    try:
        res = requests.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            headers={'Authorization': f'Bearer {request.token}'}
        )
        if res.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google token")
            
        idinfo = res.json()
        email = idinfo['email']
        name = idinfo.get('name', '')
        picture = idinfo.get('picture', '')
        google_id = idinfo.get('sub', '')
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(email=email, name=name, picture=picture, google_id=google_id)
            db.add(user)
            db.commit()
            db.refresh(user)
            
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {"id": user.id, "email": user.email, "name": user.name, "picture": user.picture}
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Google login error: {e}")

@auth_router.post("/admin/create-user")
def admin_create_user(
    request: AdminCreateUserRequest, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if current_user.email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Not authorized as admin")
        
    user = db.query(User).filter(User.email == request.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Generate random 12 character password
    password = ''.join(random.choices(string.ascii_letters + string.digits + "!@#$%^&*", k=12))
    
    new_user = User(
        email=request.email,
        name=request.name,
        hashed_password=hash_password(password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    send_credentials_email(request.email, password, request.name)
    
    return {"message": "User created successfully and credentials sent via email.", "user_id": new_user.id}

@auth_router.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "picture": current_user.picture,
        "smtp_configured": bool(current_user.smtp_username)
    }

def require_api_key(authorization: Optional[str] = Header(default=None), db: Session = Depends(get_db)):
    return get_current_user(authorization, db)

def auth_is_enabled() -> bool:
    return True
