import { Request, Response, Router } from "express";
import { ChatController } from "../controllers/chat.controller";

const chatRouter = Router();

const chatController = new ChatController();
chatRouter.post("/", (req: Request, res: Response) =>
  chatController.chatSSE(req, res),
);

export default chatRouter;
