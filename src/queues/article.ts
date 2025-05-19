import { Job, Queue, QueueEvents, Worker } from "bullmq";
import IORedis from "ioredis";
import { REDIS_URL } from "../config/environment";
import logger from "../config/logger";
import { redisClient } from "../config/redis";
import {
  RecursiveCharacterTextSplitter,
  TextSplitter,
} from "@langchain/textsplitters";
import {
  PuppeteerWebBaseLoader,
  Page,
  Browser,
} from "@langchain/community/document_loaders/web/puppeteer";
import { qdrantVectorStore } from "../config/vector-store";
import { VectorStore } from "@langchain/core/vectorstores";
import { sleep } from "../utils/helper";

export class ArticleQueue {
  private readonly connection: IORedis;
  private readonly queue: Queue;
  private readonly worker: Worker;
  private readonly events: QueueEvents;
  private readonly redis: typeof redisClient;
  private readonly textSplitter: TextSplitter;
  private readonly vectorStore: VectorStore;

  constructor(store: VectorStore) {
    this.connection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
    });

    this.queue = new Queue("article", {
      connection: this.connection,
    });

    this.events = new QueueEvents("article", {
      connection: this.connection,
    });

    this.vectorStore = store;

    this.redis = redisClient;

    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    this.worker = new Worker(
      "article",
      async (job: Job) => {
        logger.info(`job ${job.id} started`);
        const { source, id, url } = job.data;
        const loader = new PuppeteerWebBaseLoader(url, {
          launchOptions: {
            headless: true,
          },
          gotoOptions: {
            waitUntil: "domcontentloaded",
          },
          evaluate: async (page: Page, browser: Browser) => {
            await page.waitForSelector("body");
            const body = await page.$("body");
            const text = await page.evaluate((body) => body?.innerText, body);
            const strippedText = (text ?? "").replace(/[\n\r]+/g, " ");
            return strippedText;
          },
        });

        const docs = await loader.load();

        const splitDocs = await this.textSplitter.splitDocuments(docs);

        const splitDocsWithMetaData = splitDocs.map((doc) => ({
          pageContent: doc.pageContent,
          metadata: {
            source,
            id,
          },
        }));

        await this.vectorStore.addDocuments(splitDocsWithMetaData);

        await this.redis.set(`processed:${source}:${id}`, "true");

        await sleep(5000); // to avoid rate limiting
      },
      {
        connection: this.connection,
        concurrency: 1,
      },
    );

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.events.on("completed", ({ jobId }) => {
      logger.info(`job ${jobId} completed`);
    });

    this.events.on("failed", ({ jobId, failedReason }) => {
      logger.error(`job ${jobId} failed with reason: ${failedReason}`);
    });

    this.events.on("error", (error) => {
      logger.error("queue error:", error);
    });

    this.worker.on("completed", (job: Job) => {
      logger.info(`job ${job.id} completed successfully`);
    });

    this.worker.on("failed", (job: Job | undefined, error: Error) => {
      if (job) {
        logger.error(`job ${job.id} failed: ${error}`);
      } else {
        logger.error(`job failed: ${error}`);
      }
    });

    this.worker.on("error", (error) => {
      logger.error("worker error:", error);
    });
  }

  async addJob(data: any): Promise<Job> {
    return this.queue.add("process", data, {
      jobId: data.id, // to prevent duplicate jobs (same article ids, can happen when one article is being processed and same article is added again)
    });
  }

  async close(): Promise<void> {
    await this.worker.close();
    await this.queue.close();
    await this.events.close();
    await this.connection.quit();
  }
}

export const articleQueue = new ArticleQueue(qdrantVectorStore);
