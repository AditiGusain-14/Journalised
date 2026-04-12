from typing import List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import date

from database import get_db
from models import Entry, User

router = APIRouter()

class EntryCreateRequest(BaseModel):
    user_id: str
    content: str
    formatted_content: str | None = None
    entry_date: date

class EntryResponse(BaseModel):
    id: str
    user_id: str
    content: str
    formatted_content: str | None
    entry_date: date
    created_at: str

@router.post("/create", response_model=EntryResponse)
async def create_entry(payload: EntryCreateRequest, db: Session = Depends(get_db)):
    """
    Create a new journal entry.
    """
    # Verify user exists
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    entry = Entry(
        user_id=payload.user_id,
        content=payload.content,
        formatted_content=payload.formatted_content,
        entry_date=payload.entry_date
    )
    
    db.add(entry)
    db.commit()
    db.refresh(entry)
    
    return EntryResponse(
        id=str(entry.id),
        user_id=entry.user_id,
        content=entry.content,
        formatted_content=entry.formatted_content,
        entry_date=entry.entry_date,
        created_at=entry.created_at.isoformat()
    )

@router.get("/user/{user_id}", response_model=List[EntryResponse])
async def get_entries_by_user(user_id: str, db: Session = Depends(get_db)):
    """
    Get all entries for a user.
    """
    entries = db.query(Entry).filter(Entry.user_id == user_id).order_by(Entry.created_at.desc()).all()
    return [
        EntryResponse(
            id=str(e.id),
            user_id=e.user_id,
            content=e.content,
            formatted_content=e.formatted_content,
            entry_date=e.entry_date,
            created_at=e.created_at.isoformat()
        )
        for e in entries
    ]

@router.get("/date/{user_id}/{entry_date}", response_model=List[EntryResponse])
async def get_entries_by_date(user_id: str, entry_date: str, db: Session = Depends(get_db)):
    """
    Get entries for specific date.
    """
    entries = db.query(Entry).filter(
        Entry.user_id == user_id,
        Entry.entry_date == entry_date
    ).order_by(Entry.created_at.desc()).all()
    
    return [
        EntryResponse(
            id=str(e.id),
            user_id=e.user_id,
            content=e.content,
            formatted_content=e.formatted_content,
            entry_date=e.entry_date,
            created_at=e.created_at.isoformat()
        )
        for e in entries
    ]

@router.delete("/delete/{entry_id}")
async def delete_entry(entry_id: str, user_id: str, db: Session = Depends(get_db)):
    """
    Delete entry by ID.
    """
    entry = db.query(Entry).filter(
        Entry.id == entry_id,
        Entry.user_id == user_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    db.delete(entry)
    db.commit()
    
    return {"status": "ok", "deleted_id": entry_id}

