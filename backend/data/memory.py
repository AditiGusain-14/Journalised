from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional
import uuid


@dataclass
class JournalEntry:
    id: int
    user_id: str
    content: str
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class UserAccount:
    id: str
    email: str
    password: str


class InMemoryJournalStore:
    """
    Simple in-memory store for journal entries.
    This matches the requirement to keep entries in memory.
    """

    def __init__(self) -> None:
        self._entries: List[JournalEntry] = []
        self._next_id: int = 1

    def create_entry(self, user_id: str, content: str) -> JournalEntry:
        entry = JournalEntry(id=self._next_id, user_id=user_id, content=content)
        self._entries.append(entry)
        self._next_id += 1
        return entry

    def list_entries(self, user_id: str) -> List[JournalEntry]:
        return [entry for entry in self._entries if entry.user_id == user_id]

    def delete_entry(self, entry_id: int, user_id: str) -> bool:
        original_len = len(self._entries)
        self._entries = [
            entry
            for entry in self._entries
            if not (entry.id == entry_id and entry.user_id == user_id)
        ]
        return len(self._entries) < original_len


class UserStore:
    def __init__(self) -> None:
        self._users_by_email: Dict[str, UserAccount] = {}

    def register(self, email: str, password: str) -> UserAccount:
        normalized = email.strip().lower()
        if normalized in self._users_by_email:
            raise ValueError("Email already registered")
        user = UserAccount(id=str(uuid.uuid4()), email=normalized, password=password)
        self._users_by_email[normalized] = user
        return user

    def login(self, email: str, password: str) -> UserAccount:
        normalized = email.strip().lower()
        user = self._users_by_email.get(normalized)
        if not user or user.password != password:
            raise ValueError("Invalid email or password")
        return user


class ThemePreferenceStore:
    """
    In-memory user theme preference store.
    """

    def __init__(self) -> None:
        self._themes: Dict[str, str] = {}

    def set_theme(self, user_id: str, theme: str) -> None:
        self._themes[user_id] = theme

    def get_theme(self, user_id: str) -> Optional[str]:
        return self._themes.get(user_id)


journal_store = InMemoryJournalStore()
theme_store = ThemePreferenceStore()
user_store = UserStore()

