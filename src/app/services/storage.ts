import { Entry, User } from "../types";
import { apiDelete, apiGet, apiPost } from "./api";

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

  async register(email: string, password: string): Promise<User> {
    const user = await apiPost<User>("/auth/register", { email, password });
    this.setUser(user);
    return user;
  },

  async login(email: string, password: string): Promise<User> {
    const user = await apiPost<User>("/auth/login", { email, password });
    this.setUser(user);
    return user;
  },

  // Entry management via backend
  async getEntries(): Promise<Entry[]> {
    const user = this.getUser();
    if (!user?.id) return [];
    const entries = await apiGet<Array<{ id: number; user_id: string; content: string; created_at: string }>>(
      `/entry/all?user_id=${encodeURIComponent(user.id)}`
    );
    return entries.map((entry) => ({
      id: String(entry.id),
      userId: entry.user_id,
      rawContent: entry.content,
      formattedContent: entry.content,
      createdAt: entry.created_at,
      images: [],
      attachments: [],
    }));
  },

  async getEntry(id: string): Promise<Entry | null> {
    const entries = await this.getEntries();
    return entries.find((e) => e.id === id) || null;
  },

  async saveEntry(entry: Entry): Promise<Entry> {
    const user = this.getUser();
    if (!user?.id) throw new Error("Please sign in first.");
    const saved = await apiPost<{ id: number; user_id: string; content: string; created_at: string }>("/entry/create", {
      user_id: user.id,
      content: entry.formattedContent || entry.rawContent,
    });

    return {
      ...entry,
      id: String(saved.id),
      userId: saved.user_id,
      rawContent: saved.content,
      formattedContent: saved.content,
      createdAt: saved.created_at,
    };
  },

  async deleteEntry(id: string): Promise<void> {
    const user = this.getUser();
    if (!user?.id) throw new Error("Please sign in first.");
    await apiDelete<{ status: string; deleted_id: number }>(
      `/entry/delete/${id}?user_id=${encodeURIComponent(user.id)}`
    );
  },

  async getTheme(userId: string): Promise<"light" | "dark" | "beige"> {
    const response = await apiGet<{ user_id: string; theme: "light" | "dark" | "beige" }>(
      `/preferences/theme/${userId}`
    );
    return response.theme;
  },

  async saveTheme(userId: string, theme: "light" | "dark" | "beige"): Promise<void> {
    await apiPost("/preferences/theme", {
      user_id: userId,
      theme,
    });
  },

  async getEntriesByDate(date: string): Promise<Entry[]> {
    const entries = await this.getEntries();
    return entries.filter((e) => e.createdAt.startsWith(date));
  },

  async getEntriesByMonth(year: number, month: number): Promise<Entry[]> {
    const entries = await this.getEntries();
    const monthStr = `${year}-${String(month).padStart(2, "0")}`;
    return entries.filter((e) => e.createdAt.startsWith(monthStr));
  },
};
