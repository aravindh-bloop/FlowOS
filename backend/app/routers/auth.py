from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse
from app.services.auth_service import authenticate_user, create_access_token
from app.dependencies import get_current_user

router = APIRouter(tags=["auth"])

@router.post("/api/auth/login", response_model=TokenResponse)
@router.post("/api/login", response_model=TokenResponse)
@router.post("/auth/login", response_model=TokenResponse)
@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.get("/api/auth/me", response_model=UserResponse)
@router.get("/api/me", response_model=UserResponse)
@router.get("/auth/me", response_model=UserResponse)
def read_users_me(current_user = Depends(get_current_user)):
    return current_user
