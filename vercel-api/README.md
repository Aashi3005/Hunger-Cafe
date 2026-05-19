# HungerQuest Vercel API

Next.js 16 edge backend for HungerQuest recipe generation with Vercel AI SDK streaming + tool calling.

## Folder structure

```
vercel-api/
├── app/
│   ├── api/
│   │   ├── recipe/route.ts     POST — streaming recipe generation with tools
│   │   └── health/route.ts     GET  — health probe
│   └── page.tsx / layout.tsx
├── lib/
│   ├── tools/
│   │   ├── fetchDishImage.ts   Unsplash API → real food photos
│   │   ├── generateDishImage.ts DALL-E 3 → AI-generated dish art
│   │   ├── filterDietary.ts    Vegan/vegetarian/jain/keto/diabetic/GF check
│   │   ├── scaleServings.ts    Smart portion scaling (dampened spice scaling)
│   │   ├── checkTimeConstraint.ts Time budget check + shortcuts
│   │   ├── checkAllergies.ts   Allergy check inc. hidden sources
│   │   ├── checkEquipment.ts   Equipment check + alternatives
│   │   └── suggestDrinkPairing.ts Indian + international drink pairings
│   ├── schemas.ts              Zod schemas for all inputs
│   ├── prompts.ts              System + user prompt builders
│   └── rateLimit.ts            Edge-compatible in-memory rate limiter
└── .env.local.example
```

## Local dev

```bash
cd vercel-api
cp .env.local.example .env.local   # fill in your keys
npm run dev                         # → http://localhost:3001
```

Test with curl:
```bash
curl -X POST http://localhost:3001/api/recipe \
  -H 'Content-Type: application/json' \
  -d '{
    "ingredients": ["chicken", "tomato", "garlic", "cream"],
    "userPreferences": {
      "dietary": "none",
      "skillLevel": "beginner",
      "timeAvailableMinutes": 45,
      "servings": 4
    }
  }' --no-buffer
```

## Stream format

The endpoint returns the **Vercel AI SDK data stream protocol**:

```
0:"Hello"           ← text delta
9:{"toolCallId":"...","toolName":"fetchDishImage","args":{}}  ← tool call
a:{"toolCallId":"...","result":{...}}                         ← tool result
d:{"finishReason":"stop","usage":{...}}                       ← done
```

The React Native client (Phase 2) parses these prefixed lines.

## Deploy to Vercel

```bash
npm i -g vercel
vercel login
cd vercel-api
vercel deploy --prod
```

Set env vars on Vercel:
```bash
vercel env add GOOGLE_GENERATIVE_AI_API_KEY production
vercel env add UNSPLASH_ACCESS_KEY production      # optional
vercel env add OPENAI_API_KEY production           # optional, for DALL-E 3
```

Tell Vercel the root directory is `vercel-api/` in **Project Settings → General → Root Directory**.

## Key decisions

| Decision | Why |
|----------|-----|
| `maxSteps: 8` | Caps tool-call rounds; prevents infinite AI loops |
| Tools return `{ error, fallback }` instead of throwing | LLM receives the error and can adapt gracefully in its response |
| Spice scaling capped at 75% above 4× | Linear spice scaling at large batches makes food inedible |
| Rate limiter is in-memory | Good enough for edge abuse prevention; upgrade to Upstash Redis for per-user persistence across instances |
| `abortSignal: req.signal` | Frees Gemini quota immediately when client disconnects |
| `toDataStreamResponse` over `toTextStreamResponse` | Includes structured tool call/result events; Phase 2 client needs them |
