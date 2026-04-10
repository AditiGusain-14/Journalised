import { Entry, User } from "../types";

const ENTRIES_KEY = "insight_journal_entries";
const USER_KEY = "insight_journal_user";

export const storageService = {
  // User management
  getUser(): User | null {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  logout(): void {
    localStorage.removeItem(USER_KEY);
  },

  // Entry management
  getEntries(): Entry[] {
    const data = localStorage.getItem(ENTRIES_KEY);
    return data ? JSON.parse(data) : [];
  },

  getEntry(id: string): Entry | null {
    const entries = this.getEntries();
    return entries.find((e) => e.id === id) || null;
  },

  saveEntry(entry: Entry): void {
    const entries = this.getEntries();
    const index = entries.findIndex((e) => e.id === entry.id);
    if (index >= 0) {
      entries[index] = entry;
    } else {
      entries.push(entry);
    }
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  },

  deleteEntry(id: string): void {
    const entries = this.getEntries();
    const filtered = entries.filter((e) => e.id !== id);
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(filtered));
  },

  getEntriesByDate(date: string): Entry[] {
    const entries = this.getEntries();
    return entries.filter((e) => e.createdAt.startsWith(date));
  },

  getEntriesByMonth(year: number, month: number): Entry[] {
    const entries = this.getEntries();
    const monthStr = `${year}-${String(month).padStart(2, "0")}`;
    return entries.filter((e) => e.createdAt.startsWith(monthStr));
  },
};
