# HungerQuest — Vercel AI Streaming Setup (Option A)

## Architecture

```
React Native (Expo)
       │
       │  POST /api/recipe  (JSON body)
       ▼
Vercel Edge Function  ──→  @ai-sdk/google + gemini-1.5-flash
       │
       │  SSE text stream (raw JSON chunks)
       ▼
React Native ReadableStream reader
       │
       │  accumulate chunks → parse JSON array → navigate
       ▼
/recipe-suggestions screen
```

---

## What was built

### 1. Next.js backend — `vercel-api/`

| File                              | Purpose                                                          |
| --------------------------------- | ---------------------------------------------------------------- |
| `app/api/recipe/route.ts`         | Edge function — accepts POST, streams 3 recipes via `streamText` |
| `app/api/health/route.ts`         | GET health probe — returns `{status:"ok", timestamp}`            |
| `app/layout.tsx` / `app/page.tsx` | Minimal shell so Next.js is happy                                |
| `.env.local`                      | `GOOGLE_GENERATIVE_AI_API_KEY` — never commit this               |
| `.env.example`                    | Template for teammates / Vercel env vars                         |
| `next.config.ts`                  | Minimal Next.js config                                           |

**Key dependencies:**

- `ai` (Vercel AI SDK) — `streamText`, `toTextStreamResponse()`
- `@ai-sdk/google` — Google Gemini provider for the AI SDK
- `next` 16.x — App Router, Edge runtime

The route uses `export const runtime = 'edge'` so it runs on Vercel's V8 edge network, not Node.js servers. Cold starts are ~50 ms instead of ~500 ms.

### 2. React Native changes — `Hunger-Cafe/`

| File                             | Change                                                            |
| -------------------------------- | ----------------------------------------------------------------- |
| `config/apiConfig.js`            | Added `VERCEL_API_URL` constant                                   |
| `services/streamingAIService.js` | New — `generateRecipesStreaming()` + `pingBackend()`              |
| `app/recipe-generator.tsx`       | Streaming-first generation, live KB counter, animated bar, toggle |

`generateRecipesStreaming` uses `response.body.getReader()` (supported in RN 0.73+ / Hermes). Each chunk appends to `fullText`. When the stream ends, the accumulated string is parsed as a JSON array. If `getReader` is unavailable it falls back to `await response.text()`.

If the Vercel backend is unreachable (network error, cold timeout), the code automatically falls back to the existing direct Gemini SDK path so the app never shows a dead state.

---

## Local development

### Run the backend locally

```bash
cd /Users/aashikothari/Desktop/Projects/Hunger-Cafe/vercel-api
npm run dev          # starts Next.js on http://localhost:3001
```

Find your machine's LAN IP:

```bash
ipconfig getifaddr en0   # macOS Wi-Fi
```

In `config/apiConfig.js` temporarily change:

```js
export const VERCEL_API_URL = "http://192.168.x.x:3001";
```

Make sure your iPhone and Mac are on the same Wi-Fi network.

Test the endpoint directly:

```bash
curl -X POST http://localhost:3001/api/recipe \
  -H 'Content-Type: application/json' \
  -d '{"ingredients":"chicken, garlic, lemon","cuisineType":"Mediterranean"}' \
  --no-buffer
```

You should see JSON tokens arriving in real time.

---

## Deploying to Vercel (free tier)

### One-time setup

1. Install the Vercel CLI:

   ```bash
   npm i -g vercel
   ```

2. Log in:

   ```bash
   vercel login
   ```

3. Deploy from the `vercel-api/` directory:

   ```bash
   cd /Users/aashikothari/Desktop/Projects/Hunger-Cafe/vercel-api
   vercel deploy --prod
   ```

   Vercel will prompt you for a project name — call it `hunger-cafe-api`.

4. Add the environment variable in Vercel dashboard (or via CLI):

   ```bash
   vercel env add GOOGLE_GENERATIVE_AI_API_KEY production
   # paste your key when prompted
   ```

5. After deploy finishes, copy the production URL (e.g. `https://hunger-cafe-api.vercel.app`).

6. Update `config/apiConfig.js` in the React Native project:

   ```js
   export const VERCEL_API_URL = "https://hunger-cafe-api.vercel.app";
   ```

7. Rebuild and run the Expo app.

### Subsequent deploys

```bash
cd /Users/aashikothari/Desktop/Projects/Hunger-Cafe/vercel-api
vercel deploy --prod
```

---

## Using the streaming toggle in the app

In the Debug & Troubleshooting section there is a toggle:

- **⚡ Streaming (Vercel)** — uses the new edge function; shows live KB counter while recipes generate
- **🤖 Direct Gemini** — the original direct SDK call; useful if you're developing offline

The **Ping Vercel Backend** button hits `/api/health` to confirm the edge function is reachable before you try generating recipes.

---

## How the streaming works step by step

1. User taps **Generate Recipe with AI**
2. `generateRecipesStreaming()` sends `POST /api/recipe` with the form data
3. The Vercel edge function calls `streamText({ model: google('gemini-1.5-flash'), prompt })`
4. `toTextStreamResponse()` converts the `StreamTextResult` into a plain `text/plain` `Response` whose body is a `ReadableStream` of raw text chunks
5. React Native's fetch keeps the connection open; `response.body.getReader()` reads chunks one by one
6. Each chunk triggers `onChunk(fullText, bytesReceived)` — the UI updates the KB counter
7. When `done === true` the loop ends; the accumulated string is JSON-parsed
8. Recipe objects get `id`, `ratingCount`, `title`, and `imageUrl` added, then the app navigates to `/recipe-suggestions`

---

## Environment variables reference

| Variable                       | Where                             | Value                                                                     |
| ------------------------------ | --------------------------------- | ------------------------------------------------------------------------- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Vercel project env + `.env.local` | Your Gemini API key                                                       |
| `VERCEL_API_URL`               | `config/apiConfig.js` in RN app   | `https://hunger-cafe-api.vercel.app` (prod) or `http://LAN_IP:3001` (dev) |

---

## Troubleshooting

| Symptom                                 | Fix                                                                              |
| --------------------------------------- | -------------------------------------------------------------------------------- |
| "Backend Unreachable" ping fails in dev | Check LAN IP is correct and Mac firewall allows port 3001                        |
| Streaming falls back to Direct Gemini   | Vercel URL not set — check `VERCEL_API_URL` in `apiConfig.js`                    |
| JSON parse error at end of stream       | AI added markdown fences — `parseRecipesFromText` strips them automatically      |
| Quota errors                            | Vercel backend uses its own API key; quota is tracked server-side not per-device |
| CORS error                              | `OPTIONS` route and `CORS_HEADERS` are already set in `route.ts`                 |
