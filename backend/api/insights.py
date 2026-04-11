from __future__ import annotations

from typing import Dict, Any

from fastapi import APIRouter


router = APIRouter()


@router.get("/")
async def get_insights_root() -> Dict[str, Any]:
    """
    Placeholder insights endpoint.
    Frontend can be extended to call this for aggregated stats.
    """
    return {
        "message": "Insights endpoint is available.",
    }

