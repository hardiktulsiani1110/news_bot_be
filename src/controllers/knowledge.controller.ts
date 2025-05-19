import { Request, Response } from "express";
import { newsSources } from "../constants/rss";
import { NewsService } from "../services/newsService";

export class KnowledgeController {
  private readonly newsService: NewsService;
  constructor() {
    this.newsService = new NewsService();
  }
  async feedKnowledge(req: Request, res: Response) {
    const { source } = req.body;

    const validSources = newsSources.map((sourceObj) =>
      sourceObj.source.toLowerCase(),
    );
    if (!validSources.includes(source.toLowerCase())) {
      res.status(400).json({ message: "Invalid source" });
      return;
    }

    const feed = newsSources.find((sourceObj) => sourceObj.source === source);

    if (!feed || !feed.source || !feed.url) {
      res.status(400).json({ message: "Invalid source/url" });
      return;
    }

    let articles = await this.newsService.fetchNewsFromRSS(
      feed.url,
      feed.source.toLowerCase(),
    );

    return res.json({
      message: `Ingesting latest news from the below ${articles.length} articles, source: ${feed.source} `,
      articles: articles.map((article) => ({
        title: article.title,
        link: article.url,
      })),
    });
  }
}
