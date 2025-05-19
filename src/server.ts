import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import { ALLOWED_ORIGINS, PORT } from "./config/environment";
import { API_BASE_URL } from "./config/router";
import router from "./routes";
import { connectRedis } from "./config/redis";

// Initialize the Express app
const app = express();

app.set("trust proxy", 1); // trust first proxy
// Middleware setup
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || ALLOWED_ORIGINS.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
      // callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-API-Key",
      "Set-Cookie",
    ],
  }),
);
app.use(express.json()); // Parse JSON bodies
app.use(morgan("dev")); // HTTP request logging

app.use(API_BASE_URL, router);

app.get("/health", async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ message: "hey" });
  } catch (error) {
    next(error);
  }
});

// Start the server
const port = PORT || 5000;
app.listen(port, async () => {
  await connectRedis();
  console.log(`Server running on port ${port}`);
});
