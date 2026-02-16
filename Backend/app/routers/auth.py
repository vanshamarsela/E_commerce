from datetime import timedelta
from os import name
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from auth import get_password_hash
from database import get_db
from auth import (
    authenticate_user, authenticate_admin, create_access_token, create_refresh_token,
    get_current_active_user, get_current_admin, create_refresh_token_record,
    revoke_refresh_token, verify_token
)
import crud
from models import RefreshToken
from schemas import (
    User, UserCreate, Token, LoginRequest, RefreshTokenInfo, Admin
)

router = APIRouter()
security = HTTPBearer()

@router.post("/register", response_model=User)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""

    # Check if user already exists
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already taken")

    # Create user
    return crud.create_user(db=db, user=user)

@router.post("/login", response_model=Token)
def login(
    response: Response,
    login_data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Login user and return access token."""
    user = authenticate_user(db, login_data.username, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    # Create access token
    access_token_expires = timedelta(minutes=15)
    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id},
        expires_delta=access_token_expires
    )

    # Create refresh token
    refresh_token_data = {"sub": user.username, "user_id": user.id}
    refresh_token = create_refresh_token(data=refresh_token_data)

    # Store refresh token in database
    create_refresh_token_record(db, user, refresh_token, request)

    # Set refresh token as httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=30 * 24 * 60 * 60  # 30 days
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/admin/login", response_model=Token)
def admin_login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """Login admin and return access token (no refresh cookie)."""
    
    admin = authenticate_admin(db, login_data.username, login_data.password)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not admin.is_active:
        raise HTTPException(status_code=400, detail="Inactive admin")

    access_token_expires = timedelta(minutes=15)
    access_token = create_access_token(
        data={"sub": admin.username, "user_id": admin.id},
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/refresh", response_model=Token)
def refresh_token(
    response: Response,
    request: Request,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token from cookie."""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found"
        )

    # Verify refresh token
    try:
        token_data = verify_token(refresh_token, "refresh")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    # Get refresh token from database
    db_refresh_token = crud.get_refresh_token(db, refresh_token)
    if not db_refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token revoked or expired"
        )

    # Get user
    user = crud.get_user(db, token_data.user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=400, detail="User not found or inactive")

    # Update last used time
    crud.update_refresh_token_usage(db, db_refresh_token.id)

    # Create new access token
    access_token_expires = timedelta(minutes=15)
    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id},
        expires_delta=access_token_expires
    )

    # Create new refresh token (rotation)
    new_refresh_token_data = {"sub": user.username, "user_id": user.id}
    new_refresh_token = create_refresh_token(data=new_refresh_token_data)

    # Revoke old refresh token
    revoke_refresh_token(db, refresh_token)

    # Store new refresh token in database
    create_refresh_token_record(db, user, new_refresh_token, request)

    # Set new refresh token as httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=30 * 24 * 60 * 60  # 30 days
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
def logout(response: Response, request: Request, db: Session = Depends(get_db)):
    """Logout user by revoking refresh token."""
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        revoke_refresh_token(db, refresh_token)

    # Clear refresh token cookie
    response.delete_cookie(key="refresh_token", httponly=True)

    return {"message": "Successfully logged out"}

@router.get("/me", response_model=User)
def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information."""
    return current_user


@router.get("/admin/me", response_model=Admin)
def get_current_admin_info(current_admin: Admin = Depends(get_current_admin)):
    """Get current admin information (for admin panel)."""
    return current_admin

@router.get("/sessions", response_model=List[RefreshTokenInfo])
def get_user_sessions(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Get user's active sessions/devices."""
    return crud.get_user_refresh_tokens(db, current_user.id)

@router.delete("/sessions/{session_id}")
def revoke_session(
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Revoke a specific user session."""
    # Find the refresh token
    refresh_token = db.query(crud.RefreshToken).filter(
        crud.RefreshToken.id == session_id,
        crud.RefreshToken.user_id == current_user.id
    ).first()

    if not refresh_token:
        raise HTTPException(status_code=404, detail="Session not found")

    refresh_token.is_revoked = True
    db.commit()

    return {"message": "Session revoked successfully"}

@router.delete("/sessions")
def revoke_all_sessions(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Revoke all user sessions except current one."""
    crud.revoke_user_refresh_tokens(db, current_user.id)

    return {"message": "All sessions revoked successfully"}