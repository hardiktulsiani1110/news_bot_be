import { Router } from "express";
import { KnowledgeController } from "../controllers/knowledge.controller";

const knowledgeRouter = Router();

const knowledgeController = new KnowledgeController();

knowledgeRouter.post("/rss", (req, res) => {
  knowledgeController.feedKnowledge(req, res);
});

export default knowledgeRouter;
