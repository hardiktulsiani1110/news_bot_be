export interface Message {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  context?: string[];
}

export interface ChatSession {
  id: string;
  messages: Message[];
  createdAt: Date;
  lastActivity: Date;
}

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  url: string;
  publishedAt: Date;
  source: string;
}

export interface EmbeddingVector {
  id: string;
  vector: number[];
  payload: {
    title: string;
    content: string;
    url: string;
    source: string;
  };
}

export interface SearchResult {
  id: string;
  score: number;
  payload: any;
}
