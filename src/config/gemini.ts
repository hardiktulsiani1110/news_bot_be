import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GEMINI_API_KEY } from "./environment";

const geminiModel = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  maxOutputTokens: 2048,
  apiKey: GEMINI_API_KEY,
});

export default geminiModel;
