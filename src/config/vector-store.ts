import { QdrantClient } from "@qdrant/js-client-rest";
import { JinaEmbeddings } from "@langchain/community/embeddings/jina";
import { JINA_API_KEY, QDRANT_API_KEY, QDRANT_URL } from "./environment";
import { QdrantVectorStore } from "@langchain/qdrant";

const qdrantClient = new QdrantClient({
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY,
});

const embeddings = new JinaEmbeddings({
  apiKey: JINA_API_KEY,
  model: "jina-clip-v2", // Optional, defaults to "jina-clip-v2"
});

export const qdrantVectorStore = new QdrantVectorStore(embeddings, {
  client: qdrantClient,
  metadataPayloadKey: "metadata",
  collectionName: "articles",
});
