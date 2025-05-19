import { Request, Response } from "express";
import { qdrantVectorStore } from "../config/vector-store";
import { ChatService } from "../services/chatService";
import { sleep } from "../utils/helper";

export class ChatController {
  private readonly chatService: ChatService;
  constructor() {
    this.chatService = new ChatService(qdrantVectorStore);
  }

  async chatSSE(req: Request, res: Response) {
    try {
      const { query, sessionId } = req.body;
      const { stream, session } = await this.chatService.chat(query, sessionId);

      // SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("X-Accel-Buffering", "no");

      // Send session info
      res.write(`data: {"type": "session", "sessionId": "${session}"}\n\n`);
      // res.flush && res.flush();

      let chunkCount = 0;
      let fullResponse = "";

      // Process stream
      for await (const chunk of stream) {
        chunkCount++;
        fullResponse += chunk;

        // Send as SSE event
        const eventData = {
          type: "chunk",
          chunkNumber: chunkCount,
          content: chunk,
          partial: fullResponse,
        };

        res.write(`data: ${JSON.stringify(eventData)}\n\n`);

        // Small delay
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Send completion event
      res.write(
        `data: {"type": "complete", "totalChunks": ${chunkCount}, "fullResponse": ${JSON.stringify(fullResponse)}}\n\n`,
      );
      res.end();
    } catch (error: any) {
      console.error("Chat error:", error);
      if (!res.headersSent) {
        res.write(`data: {"type": "error", "error": "${error.message}"}\n\n`);
        res.end();
      }
    }
  }
}
