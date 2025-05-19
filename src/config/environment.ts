import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || 5000;
export const NODE_ENV = process.env.NODE_ENV || "development";
export const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "").split(",");
export const QDRANT_API_KEY = process.env.QDRANT_API_KEY || "";
export const QDRANT_URL = process.env.QDRANT_URL || "";
export const JINA_API_KEY = process.env.JINA_API_KEY || "";
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
export const REDIS_URL = process.env.REDIS_URL || "";
