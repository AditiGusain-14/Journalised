from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, field_validator

from data.memory import theme_store


router = APIRouter()


class ThemeUpdateRequest(BaseModel):
    user_id: str
    theme: str

    @field_validator("theme")
    @classmethod
    def validate_theme(cls, value: str) -> str:
        normalized = value.lower().strip()
        if normalized == "warm":
            normalized = "beige"
        if normalized not in {"light", "dark", "beige"}:
            raise ValueError("Theme must be one of: light, dark, beige")
        return normalized


@router.get("/theme/{user_id}")
async def get_theme(user_id: str):
    theme = theme_store.get_theme(user_id) or "light"
    if theme == "warm":
        theme = "beige"
    return {"user_id": user_id, "theme": theme}


@router.post("/theme")
async def set_theme(payload: ThemeUpdateRequest):
    theme_store.set_theme(payload.user_id, payload.theme)
    return {"status": "ok", "user_id": payload.user_id, "theme": payload.theme}
