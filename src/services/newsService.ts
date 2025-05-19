import Parser from "rss-parser";
import { NewsArticle } from "../types/schema";
import { redisClient } from "../config/redis";
import { articleQueue } from "../queues/article";
import { articlesPerSource } from "../constants/rss";

export class NewsService {
  private parser: Parser;
  private redis: typeof redisClient;

  constructor() {
    this.parser = new Parser();
    this.redis = redisClient;
  }

  async fetchNewsFromRSS(
    feedUrl: string,
    source: string,
  ): Promise<NewsArticle[]> {
    try {
      const feed = await this.parser.parseURL(feedUrl);
      const articles: NewsArticle[] = [];

      console.log(
        `Ingesting latest news from ${source}, feed length: ${feed.items.length} articles`,
      );

      let counter = 0;

      for (const item of feed.items) {
        let articleId = item.guid || item.id || item.link;
        // console.log("articleId", item.guid);

        let isProcessed = await this.redis.get(
          `processed:${source}:${articleId}`,
        );

        if (!item.link || !item.title || !item.contentSnippet || isProcessed)
          continue;

        articles.push({
          id: articleId,
          title: item.title,
          content: item.contentSnippet,
          url: item.link,
          publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          source,
        });

        await articleQueue.addJob({
          id: articleId,
          title: item.title,
          content: item.contentSnippet,
          url: item.link,
          publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          source,
        });

        counter++;
        if (counter >= articlesPerSource) {
          break;
        }
      }

      return articles;
    } catch (error) {
      console.error(`Error fetching RSS from ${feedUrl}:`, error);
      return [];
    }
  }
}
