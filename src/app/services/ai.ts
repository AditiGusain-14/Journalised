import { Entry, MonthlyInsight } from "../types";
import { apiPost, apiUpload } from "./api";

export const aiService = {
  async formatEntry(rawContent: string): Promise<string> {
    if (!rawContent.trim()) return "";

    const response = await apiPost<{
      formatted: string;
      insights: string[];
      suggestions: string[];
    }>("/ai/format_entry", {
      text: rawContent,
    });

    // Primary: Insert structured formatted text
    let result = response.formatted || rawContent;

    // Append insights if available
    if (response.insights && response.insights.length > 0) {
      result += "\n\n### Insights\n" + response.insights.map(i => `- ${i}`).join("\n");
    }

    if (response.suggestions && response.suggestions.length > 0) {
      result += "\n\n### Suggestions\n" + response.suggestions.map(s => `- ${s}`).join("\n");
    }

    return result;
  },

  async askRag(question: string): Promise<string> {
    const response = await apiPost<{ answer: string; contexts_used: number }>("/ai/rag_query", {
      query: question,
    });
    return response.answer;
  },

  async uploadImage(file: File): Promise<{ file_id: string; chunks_stored: string }> {
    return apiUpload<{ file_id: string; chunks_stored: string }>("/upload/image", file);
  },

  async uploadPdf(file: File): Promise<{ file_id: string; chunks_stored: string }> {
    return apiUpload<{ file_id: string; chunks_stored: string }>("/upload/pdf", file);
  },

  async analyzePDF(fileName: string): Promise<string> {
    return this.askRag(`Analyze "${fileName}" - main points and insights.`);
  },

  generateMonthlyInsight(entries: Entry[], year: number, month: number): MonthlyInsight {
    const monthName = new Date(year, month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const keyEvents = entries.slice(0, 5).map(entry => ({
      date: new Date(entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      event: entry.formattedContent.split("\n")[0]?.substring(0, 60) + "..." || "Entry",
    }));
    const highlights = [
      `Entries: ${entries.length}`,
      `Avg length: ${Math.round(entries.reduce((sum, e) => sum + e.formattedContent.split(/\s+/).length, 0) / entries.length || 0)} words`,
    ];
    const patterns = entries.length < 3 ? "Need more entries" : "Active journaling";
    return {
      month: monthName,
      summary: `Created ${entries.length} entries in ${monthName}.`,
      keyEvents, highlights, patterns
    };
  },

  compareMonths(m1: Entry[], m2: Entry[], m1Name: string, m2Name: string): string {
    const c1 = m1.length, c2 = m2.length;
    return `## ${m1Name} vs ${m2Name}\nEntries: ${c1} → ${c2} (${((c2-c1)/c1*100 || 0).toFixed(0)}%)`;
  },

  getMostActiveDay(entries: Entry[]): string {
    const counts: Record<string, number> = {};
    entries.forEach(e => {
      const day = new Date(e.createdAt).toLocaleDateString("en-US", { weekday: "long" });
      counts[day] = (counts[day] || 0) + 1;
    });
    return Object.entries(counts).reduce((a, b) => (b[1] > a[1] ? b : a))[0] || "None";
  },

  getAverageLength(entries: Entry[]): number {
    return Math.round(entries.reduce((sum, e) => sum + e.formattedContent.split(/\s+/).length, 0) / entries.length || 0);
  },

  detectPatterns(entries: Entry[]): string {
    if (entries.length < 3) return "More data needed.";
    const consistent = entries.every((e, i) => {
      if (i === 0) return true;
      const prev = new Date(entries[i-1].createdAt);
      const diff = Math.abs((new Date(e.createdAt).getTime() - prev.getTime()) / (8.64e7));
      return diff <= 3;
    });
    return consistent ? "Regular pattern" : "Sporadic - set reminders.";
  }
};

