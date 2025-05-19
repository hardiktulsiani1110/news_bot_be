import { Router } from "express";
import knowledgeRouter from "./knowledge.router";
import chatRouter from "./chat.router";

const router = Router();

router.use("/knowledge", knowledgeRouter);
router.use("/chat", chatRouter);

export default router;
