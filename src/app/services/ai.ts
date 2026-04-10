import { Entry, MonthlyInsight } from "../types";

// Mock AI service that simulates intelligent formatting and insights
export const aiService = {
  // Format raw text into structured content
  formatEntry(rawContent: string): string {
    if (!rawContent.trim()) return "";

    // Simple intelligent parsing
    const lines = rawContent.split("\n").filter((line) => line.trim());
    const formatted: string[] = [];
    let currentSection = "";

    lines.forEach((line) => {
      const lowerLine = line.toLowerCase();

      // Detect sections based on keywords
      if (
        lowerLine.includes("sales") ||
        lowerLine.includes("revenue") ||
        lowerLine.includes("dropped") ||
        lowerLine.includes("increased")
      ) {
        if (!currentSection.includes("Sales")) {
          formatted.push("\n### 📊 Sales Update");
          currentSection = "Sales";
        }
        formatted.push(`- ${line}`);
      } else if (
        lowerLine.includes("issue") ||
        lowerLine.includes("problem") ||
        lowerLine.includes("not working") ||
        lowerLine.includes("underperforming")
      ) {
        if (!currentSection.includes("Issues")) {
          formatted.push("\n### ⚠️ Issues");
          currentSection = "Issues";
        }
        formatted.push(`- ${line}`);
      } else if (
        lowerLine.includes("need to") ||
        lowerLine.includes("should") ||
        lowerLine.includes("check") ||
        lowerLine.includes("analyze") ||
        lowerLine.includes("review")
      ) {
        if (!currentSection.includes("Next")) {
          formatted.push("\n### 📌 Next Steps");
          currentSection = "Next";
        }
        formatted.push(`- ${line}`);
      } else if (
        lowerLine.includes("uploaded") ||
        lowerLine.includes("attached") ||
        lowerLine.includes("report")
      ) {
        if (!currentSection.includes("Documents")) {
          formatted.push("\n### 📎 Documents");
          currentSection = "Documents";
        }
        formatted.push(`- ${line}`);
      } else if (
        lowerLine.includes("learning") ||
        lowerLine.includes("studied") ||
        lowerLine.includes("notes") ||
        lowerLine.includes("class")
      ) {
        if (!currentSection.includes("Learning")) {
          formatted.push("\n### 📚 Learning Notes");
          currentSection = "Learning";
        }
        formatted.push(`- ${line}`);
      } else {
        // Default section
        if (!currentSection) {
          formatted.push("### ✨ Summary");
          currentSection = "Summary";
        }
        formatted.push(`- ${line}`);
      }
    });

    return formatted.join("\n");
  },

  // Generate monthly insight
  generateMonthlyInsight(entries: Entry[], year: number, month: number): MonthlyInsight {
    const monthName = new Date(year, month - 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    // Extract key events
    const keyEvents = entries.slice(0, 5).map((entry) => ({
      date: new Date(entry.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      event: entry.formattedContent.split("\n")[1]?.substring(0, 60) + "..." || "Entry created",
    }));

    // Generate highlights
    const highlights = [
      `Total entries: ${entries.length}`,
      `Most active day: ${this.getMostActiveDay(entries)}`,
      `Average entry length: ${this.getAverageLength(entries)} words`,
    ];

    // Detect patterns
    const patterns = this.detectPatterns(entries);

    const summary = `You created ${entries.length} entries in ${monthName}. ${
      entries.length > 10
        ? "High activity month with consistent journaling."
        : entries.length > 5
        ? "Moderate journaling activity."
        : "Light journaling month."
    }`;

    return {
      month: monthName,
      summary,
      keyEvents,
      highlights,
      patterns,
    };
  },

  // Compare two months
  compareMonths(
    month1Entries: Entry[],
    month2Entries: Entry[],
    month1Name: string,
    month2Name: string
  ): string {
    const count1 = month1Entries.length;
    const count2 = month2Entries.length;
    const diff = count2 - count1;
    const percentChange = count1 > 0 ? ((diff / count1) * 100).toFixed(1) : "N/A";

    let comparison = `## ${month1Name} vs ${month2Name}\n\n`;
    comparison += `### 📊 Key Differences\n`;
    comparison += `- ${month1Name}: ${count1} entries\n`;
    comparison += `- ${month2Name}: ${count2} entries\n`;
    comparison += `- Change: ${diff > 0 ? "+" : ""}${diff} entries (${percentChange}%)\n\n`;

    comparison += `### 📈 Trend\n`;
    if (diff > 0) {
      comparison += `- Increased activity in ${month2Name}\n`;
      comparison += `- More consistent journaling habit\n`;
    } else if (diff < 0) {
      comparison += `- Decreased activity in ${month2Name}\n`;
      comparison += `- Consider setting regular journaling reminders\n`;
    } else {
      comparison += `- Consistent activity across both months\n`;
    }

    comparison += `\n### 💡 Insight\n`;
    comparison += `Your journaling pattern shows ${
      diff > 0 ? "growth" : diff < 0 ? "a need for more consistency" : "stability"
    }.`;

    return comparison;
  },

  // PDF analysis mock
  analyzePDF(extractedText: string): string {
    const wordCount = extractedText.split(/\s+/).length;
    const sentences = extractedText.split(/[.!?]+/).filter((s) => s.trim());

    let summary = `## 📄 Document Analysis\n\n`;
    summary += `**Word count:** ${wordCount}\n`;
    summary += `**Estimated reading time:** ${Math.ceil(wordCount / 200)} minutes\n\n`;
    summary += `### Key Points\n`;
    summary += sentences
      .slice(0, 3)
      .map((s, i) => `${i + 1}. ${s.trim()}`)
      .join("\n");

    return summary;
  },

  // Helper functions
  getMostActiveDay(entries: Entry[]): string {
    const dayCounts: Record<string, number> = {};
    entries.forEach((entry) => {
      const day = new Date(entry.createdAt).toLocaleDateString("en-US", {
        weekday: "long",
      });
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    const maxDay = Object.entries(dayCounts).reduce(
      (max, [day, count]) => (count > max[1] ? [day, count] : max),
      ["None", 0]
    );

    return maxDay[0];
  },

  getAverageLength(entries: Entry[]): number {
    if (entries.length === 0) return 0;
    const totalWords = entries.reduce((sum, entry) => {
      return sum + entry.formattedContent.split(/\s+/).length;
    }, 0);
    return Math.round(totalWords / entries.length);
  },

  detectPatterns(entries: Entry[]): string {
    if (entries.length < 3) return "Not enough data to detect patterns.";

    const hasConsistentTiming = entries.every((entry, i) => {
      if (i === 0) return true;
      const prevDate = new Date(entries[i - 1].createdAt);
      const currDate = new Date(entry.createdAt);
      const dayDiff = Math.abs(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return dayDiff <= 3;
    });

    if (hasConsistentTiming) {
      return "Consistent journaling pattern detected. Regular entries help maintain clarity.";
    }

    return "Sporadic journaling pattern. Consider setting a regular schedule.";
  },
};
