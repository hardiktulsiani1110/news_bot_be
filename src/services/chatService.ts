import { VectorStore } from "@langchain/core/vectorstores";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import {
  RunnableSequence,
  RunnableWithMessageHistory,
} from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import geminiModel from "../config/gemini";
import { UpstashRedisChatMessageHistory } from "@langchain/community/stores/message/upstash_redis";
import { v4 as uuidv4 } from "uuid";
import { RedisChatMessageHistory } from "@langchain/redis";
import { REDIS_URL } from "../config/environment";

export class ChatService {
  private readonly vectorStore: VectorStore;

  constructor(vectorStore: VectorStore) {
    this.vectorStore = vectorStore;
  }

  private async searchRelevantDocs(query: string) {
    // Get relevant context from vector store
    const vectorSearchResults = await this.vectorStore.similaritySearch(
      query,
      10,
    );

    return vectorSearchResults;
  }

  async chat(query: string, sessionId?: string) {
    const vectorSearchResults = await this.searchRelevantDocs(query);

    const session = sessionId ?? uuidv4();

    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        "You are a helpful AI assistant for providing news. Context from knowledge base:\n{context}",
      ],
      new MessagesPlaceholder("history"),
      ["human", "{question}"],
    ]);

    const chain = RunnableSequence.from([
      {
        question: (input: {
          question: string;
          context: string;
          history?: any;
        }) => input.question,
        context: (input: {
          question: string;
          context: string;
          history?: any;
        }) => input.context,
        history: (input: {
          question: string;
          context: string;
          history?: any;
        }) => input.history ?? [],
      },
      prompt,
      geminiModel,
      new StringOutputParser(),
    ]);

    const chainWithMessageHistory = new RunnableWithMessageHistory({
      runnable: chain,
      getMessageHistory: (sessionId) =>
        new RedisChatMessageHistory({
          sessionId,
          config: {
            url: REDIS_URL,
          },
        }) ?? [],

      inputMessagesKey: "question",
      historyMessagesKey: "history",
    });

    const stream = await chainWithMessageHistory.stream(
      {
        question: query,
        context: vectorSearchResults.map((doc) => doc.pageContent).join("\n\n"),
      },
      {
        configurable: {
          sessionId: session,
        },
      },
    );
    return { stream, session };
  }
}
