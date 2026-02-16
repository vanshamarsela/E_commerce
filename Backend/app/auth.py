from datetime import datetime, timedelta
import os
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import secrets
import hashlib
from user_agents import parse as parse_user_agent

from database import get_db
from models import User, Admin, RefreshToken
from schemas import TokenData

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")  # In production, use env var
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__default_rounds=12)

# Security scheme
security = HTTPBearer()


def get_password_hash(password: str) -> str:
    """Hash a password using PBKDF2 for now (simpler than bcrypt for testing)."""
    # Create a salt
    salt = secrets.token_hex(16)
    # Hash password with salt using PBKDF2
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    # Return salt + hash as hex string
    return f"{salt}${hashed.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    try:
        # Split salt and hash
        salt, stored_hash = hashed_password.split('$', 1)

        # Hash the input password with the same salt
        hashed = hashlib.pbkdf2_hmac('sha256', plain_password.encode(), salt.encode(), 100000)

        return secrets.compare_digest(hashed.hex(), stored_hash)
    except:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """Create a JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str, token_type: str = "access") -> TokenData:
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: int = payload.get("user_id")
        token_type_in_payload: str = payload.get("type")

        if username is None or user_id is None:
            raise JWTError("Invalid token data")

        if token_type_in_payload != token_type:
            raise JWTError("Invalid token type")

        return TokenData(username=username, user_id=user_id)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(token: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> User:
    """Get the current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token_data = verify_token(token.credentials, "access")

    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get the current active user (dependency for protected routes)."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Authenticate a user by username/email and password."""
    user = db.query(User).filter(
        (User.username == username) | (User.email == username)
    ).first()

    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def authenticate_admin(db: Session, username: str, password: str) -> Optional[Admin]:
    """Authenticate an admin by username/email and password. Deprecated admins cannot log in."""
    admin = db.query(Admin).filter(
        (Admin.username == username) | (Admin.email == username),
        Admin.deprecated.is_(False)
    ).first()

    if not admin:
        return None
    if not verify_password(password, admin.hashed_password):
        return None
    return admin

def get_current_admin(token: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> Admin:
    """Get the current authenticated admin. Deprecated admins are rejected."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token_data = verify_token(token.credentials, "access")
    admin = db.query(Admin).filter(Admin.id == token_data.user_id, Admin.deprecated.is_(False)).first()
    if admin is None:
        raise credentials_exception
    if not admin.is_active:
        raise HTTPException(status_code=400, detail="Inactive admin")
    return admin

def create_device_fingerprint(request: Request) -> str:
    """Create a unique device fingerprint."""
    user_agent = request.headers.get("user-agent", "")
    accept_language = request.headers.get("accept-language", "")
    accept_encoding = request.headers.get("accept-encoding", "")

    # Create a hash from various browser fingerprints
    fingerprint_data = f"{user_agent}{accept_language}{accept_encoding}"
    return hashlib.sha256(fingerprint_data.encode()).hexdigest()

def parse_user_agent_info(user_agent_string: str) -> dict:
    """Parse user agent string to extract OS, browser, device info."""
    try:
        ua = parse_user_agent(user_agent_string)
        return {
            "os": f"{ua.os.family} {ua.os.version_string}",
            "browser": f"{ua.browser.family} {ua.browser.version_string}",
            "device": ua.device.family or "Unknown",
            "is_mobile": ua.is_mobile
        }
    except:
        return {
            "os": "Unknown",
            "browser": "Unknown",
            "device": "Unknown",
            "is_mobile": False
        }

def create_refresh_token_record(db: Session, user: User, token: str, request: Request) -> RefreshToken:
    """Create a refresh token record in the database."""
    device_fingerprint = create_device_fingerprint(request)
    user_agent = request.headers.get("user-agent", "")
    client_ip = request.client.host if hasattr(request, 'client') and request.client else request.headers.get("x-forwarded-for", "").split(",")[0].strip() or request.headers.get("x-real-ip", "")

    ua_info = parse_user_agent_info(user_agent)

    expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    refresh_token_record = RefreshToken(
        token=token,
        user_id=user.id,
        device_fingerprint=device_fingerprint,
        user_agent=user_agent,
        ip_address=client_ip,
        **ua_info,
        expires_at=expires_at
    )

    db.add(refresh_token_record)
    db.commit()
    db.refresh(refresh_token_record)

    return refresh_token_record

def revoke_refresh_token(db: Session, token: str):
    """Revoke a refresh token."""
    refresh_token = db.query(RefreshToken).filter(RefreshToken.token == token).first()
    if refresh_token:
        refresh_token.is_revoked = True
        db.commit()

def cleanup_expired_tokens(db: Session):
    """Clean up expired refresh tokens."""
    expired_tokens = db.query(RefreshToken).filter(
        (RefreshToken.expires_at < datetime.utcnow()) |
        (RefreshToken.is_revoked == True)
    ).all()

    for token in expired_tokens:
        db.delete(token)

    db.commit()