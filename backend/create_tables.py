from database import engine, Base
from models import User, Entry, File

# Create all tables
Base.metadata.create_all(bind=engine)

print("✅ Database tables created: users, entries, files")
print("💾 Using SQLite: insightjournal.db (upgrade to PostgreSQL later)")
