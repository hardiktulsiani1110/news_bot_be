import { createClient } from "redis";
import { REDIS_URL } from "./environment";

export const redisClient = createClient({
  url: REDIS_URL,
});

redisClient.on("error", (err: any) => {
  console.error("Redis Client Error:", err);
});

export const connectRedis = async () => {
  await redisClient.connect();
  console.log("Redis connected successfully");
};
