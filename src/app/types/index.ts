export interface User {
  id: string;
  email: string;
  theme: "light" | "dark" | "warm";
}

export interface Entry {
  id: string;
  userId: string;
  rawContent: string;
  formattedContent: string;
  createdAt: string;
  images: string[];
  attachments: Attachment[];
}

export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  extractedText?: string;
  dataUrl: string;
}

export interface MonthlyInsight {
  month: string;
  summary: string;
  keyEvents: Array<{ date: string; event: string }>;
  highlights: string[];
  patterns: string;
}
