from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator

from data.memory import user_store, theme_store


router = APIRouter()


class AuthRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or "." not in normalized.split("@")[-1]:
            raise ValueError("Invalid email format")
        return normalized


class AuthResponse(BaseModel):
    id: str
    email: str
    theme: str


@router.post("/register", response_model=AuthResponse)
async def register(payload: AuthRequest) -> AuthResponse:
    try:
        user = user_store.register(payload.email, payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    theme_store.set_theme(user.id, "light")
    return AuthResponse(id=user.id, email=user.email, theme="light")


@router.post("/login", response_model=AuthResponse)
async def login(payload: AuthRequest) -> AuthResponse:
    try:
        user = user_store.login(payload.email, payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    theme = theme_store.get_theme(user.id) or "light"
    return AuthResponse(id=user.id, email=user.email, theme=theme)
