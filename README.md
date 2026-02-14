# Rizq AI Backend

A full-stack Node.js backend for job matching and application management.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment configuration:**
   ```bash
   cp env.example .env
   # Edit .env with your MongoDB, Redis, and DeepSeek credentials
   ```

3. **Database setup:**
   ```bash
   # Start MongoDB and Redis (using Docker)
   docker-compose up -d mongo redis
   ```

4. **Development:**
   ```bash
   npm run dev
   ```

5. **Build and run:**
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

- `GET /health` - Health check
- `GET /api/v1/metrics` - Prometheus metrics
- `GET /api/v1/auth/me` - Get current user
- `GET /api/v1/jobs` - List jobs
- `GET /api/v1/jobs/matches` - Get job matches for user
- `GET /api/v1/applications` - List user applications
- `POST /api/v1/applications/bulk-apply` - Bulk apply to jobs
- `POST /api/v1/ai/chat` - Minimal chat completion via DeepSeek (`{ prompt, system? }`). Configure `DEEPSEEK_API_KEY` and optionally `DEEPSEEK_BASE_URL`.

## Architecture

- **Express.js** with TypeScript
- **Mongoose** for MongoDB ODM
- **BullMQ** for job queues
- **Redis** for caching and queues
- **JWT** for authentication
- **Winston** for logging
- **Prometheus** for metrics

## Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run test` - Run tests
- `npm run lint` - Run ESLint

## Data integrations (additive)

- Scraped jobs are upserted idempotently via `src/scraping/store/ScrapedJobStore.ts` using `compositeKey`.
- Scraping results are cached via `src/scraping/cache/ScrapingCache.ts` (Redis TTL 24h).
- Ensure indexes: `npm run ensure-indexes`.
- Warm cache: `npm run warm-cache` (no-op when Redis disabled).

## Environment

See `env.example`. Required keys for integrations:

- `MONGO_URI`: Mongo connection string.
- `REDIS_URL`: Redis URL. If omitted/disabled, cache is a no-op.


