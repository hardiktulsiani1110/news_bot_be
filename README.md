# News AI Backend

A Node.js/Express backend service that aggregates news from RSS feeds, processes them using vector embeddings, and provides an AI-powered chat interface for querying news content.

## Features

- **RSS News Aggregation**: Automatically fetches and processes news articles from multiple RSS sources
- **Vector Search**: Uses Qdrant vector database with Jina embeddings for semantic search
- **AI Chat Interface**: Conversational AI powered by Google's Gemini model with chat history
- **Background Processing**: Queue-based article processing using BullMQ and Redis
- **Web Scraping**: Extracts full article content using Puppeteer
- **Real-time Communication**: Server-Sent Events (SSE) for streaming chat responses

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Vector Database**: Qdrant
- **Embeddings**: Jina AI (jina-clip-v2)
- **LLM**: Google Gemini 1.5 Flash
- **Queue System**: BullMQ with Redis
- **Web Scraping**: Puppeteer
- **Chat History**: Redis with LangChain
- **Logging**: Winston
- **RSS Parsing**: rss-parser

## Prerequisites

- Node.js 18+
- Redis server
- Qdrant vector database
- API keys for:
  - Google Gemini
  - Jina AI
  - Qdrant Cloud (if using hosted)

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd news-ai-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   Create a `.env` file in the root directory:

   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

   # API Keys
   GEMINI_API_KEY=your_gemini_api_key
   JINA_API_KEY=your_jina_api_key
   QDRANT_API_KEY=your_qdrant_api_key

   # Database URLs
   QDRANT_URL=https://your-qdrant-instance.qdrant.io
   REDIS_URL=redis://localhost:6379
   ```

4. **Start the services**

   Start Redis:

   ```bash
   redis-server
   ```

   Start Qdrant (if running locally):

   ```bash
   docker run -p 6333:6333 qdrant/qdrant
   ```

5. **Run the application**

   ```bash
   # Development
   npm run dev

   # Production build
   npm run build
   npm start
   ```

## API Endpoints

### Health Check

```
GET /health
```

Returns server status.

### Knowledge Base

```
POST /v1/api/knowledge/rss
```

Manually trigger RSS feed ingestion for a specific source.

**Request Body:**

```json
{
  "source": "NBC Tech"
}
```

### Chat

```
POST /v1/api/chat
```

Stream chat responses using Server-Sent Events.

**Request Body:**

```json
{
  "query": "What's the latest in AI technology?",
  "sessionId": "optional-session-id"
}
```

**Response:** SSE stream with events:

- `session`: Contains session ID
- `chunk`: Streaming response chunks
- `complete`: Final response
- `error`: Error information

## Configuration

### RSS Sources

Edit `src/constants/rss.ts` to add/remove news sources:

```typescript
export const newsSources = [
  { url: "https://feeds.nbcnews.com/nbcnews/public/tech", source: "NBC Tech" },
  {
    url: "https://www.wired.com/feed/category/business/latest/rss",
    source: "Wired Business",
  },
  // Add more sources...
];

export const articlesPerSource = 2; // Number of articles to process per source
```

### Vector Store Configuration

The system uses:

- **Chunk Size**: 1000 characters
- **Chunk Overlap**: 200 characters
- **Similarity Search**: Top 10 results
- **Collection Name**: "articles"

### Queue Processing

Articles are processed asynchronously:

- **Concurrency**: 1 (to avoid rate limiting)
- **Rate Limiting**: 5-second delay between jobs
- **Deduplication**: Jobs use article ID to prevent duplicates

## Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   RSS Sources   │───▶│  News Service   │
└─────────────────┘    └─────────────────┘
                              │
                              ▼
┌─────────────────┐    ┌─────────────────┐
│   BullMQ Queue  │◀───│  Article Queue  │
└─────────────────┘    └─────────────────┘
         │                      │
         ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│   Puppeteer     │───▶│ Text Splitter   │
│  Web Scraper    │    └─────────────────┘
└─────────────────┘           │
                              ▼
                    ┌─────────────────┐
                    │ Jina Embeddings │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Qdrant Vector   │
                    │    Database     │
                    └─────────────────┘
                              │
                              ▼
┌─────────────────┐    ┌─────────────────┐
│   Chat Service  │◀───│ Vector Search   │
└─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐
│ Gemini LLM      │───▶│  SSE Response   │
└─────────────────┘    └─────────────────┘
```

## Development

### Project Structure

```
src/
├── config/          # Configuration files
│   ├── environment.ts
│   ├── gemini.ts
│   ├── logger.ts
│   ├── redis.ts
│   └── vector-store.ts
├── constants/       # Application constants
│   └── rss.ts
├── controllers/     # Request handlers
│   ├── chat.controller.ts
│   └── knowledge.controller.ts
├── queues/          # Background job queues
│   └── article.ts
├── routes/          # API route definitions
│   ├── chat.router.ts
│   ├── knowledge.router.ts
│   └── index.ts
├── services/        # Business logic
│   ├── chatService.ts
│   └── newsService.ts
├── types/           # TypeScript definitions
│   └── schema.ts
├── utils/           # Utility functions
│   └── helper.ts
└── server.ts        # Application entry point
```

### Scripts

```json
{
  "dev": "ts-node-dev src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "lint": "eslint src/**/*.ts",
  "test": "jest"
}
```

## Monitoring

### Logging

Logs are written to:

- Console (development)
- `logs/combined.log` (all logs)
- `logs/error.log` (errors only)

### Queue Monitoring

Monitor job processing:

- Completed jobs logged with timing
- Failed jobs logged with error details
- Queue events tracked for debugging

## Performance Considerations

1. **Rate Limiting**: 5-second delay between article processing jobs
2. **Concurrency**: Single worker to avoid overwhelming external services
3. **Caching**: Redis stores processed article IDs to prevent reprocessing
4. **Memory**: Text splitter chunks large articles for better embedding performance

## Troubleshooting

### Common Issues

1. **Puppeteer fails to load pages**

   - Check if target websites block headless browsers
   - Adjust `waitUntil` options in `PuppeteerWebBaseLoader`

2. **Vector search returns no results**

   - Verify Qdrant collection exists and has data
   - Check embedding model compatibility

3. **Chat responses are slow**

   - Monitor Gemini API rate limits
   - Consider adjusting `maxOutputTokens`

4. **Queue jobs stuck**
   - Check Redis connection
   - Monitor BullMQ dashboard
