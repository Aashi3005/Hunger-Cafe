import { streamObject } from 'ai';
import { ZodError } from 'zod';
import { RecipeRequestSchema, RecipeOutputSchema } from '../../../lib/schemas';
import { buildSystemPrompt } from '../../../lib/prompts';
import { checkRateLimit, getRateLimitKey } from '../../../lib/rateLimit';
import { selectModel } from '../../../lib/models';

export const runtime = 'edge';

const CORS: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function errorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(req: Request): Promise<Response> {
  // ── Rate limiting ──────────────────────────────────────────────────────────
  const rl = checkRateLimit(getRateLimitKey(req), 20, 60_000);
  if (!rl.allowed) {
    return errorResponse(429, `Rate limit exceeded. Retry after ${new Date(rl.resetAt).toISOString()}`);
  }

  // ── Parse + validate body ──────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse(400, 'Invalid JSON body');
  }

  let parsed;
  try {
    parsed = RecipeRequestSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return errorResponse(400, `Validation: ${err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    return errorResponse(400, 'Bad request');
  }

  const { ingredients, userPreferences, cuisineHint, modelPreference } = parsed;
  const { model, id: modelId, label: modelLabel } = selectModel(modelPreference);

  console.log(`[recipe-structured] using model: ${modelId} (${modelLabel})`);

  // Pre-fetch an image so it can be embedded in the schema.
  // We call the Unsplash logic directly here — no LLM tool loop needed.
  const imageUrl = await prefetchImage(ingredients[0] ?? 'food dish');

  // ── streamObject — forces structured JSON output matching RecipeOutputSchema ─
  const result = streamObject({
    model,
    schema: RecipeOutputSchema,
    system: buildSystemPrompt(userPreferences),
    prompt: buildStructuredPrompt(ingredients, userPreferences, cuisineHint, imageUrl),
    temperature: 0.7,
    maxOutputTokens: 4096,
    abortSignal: req.signal,

    onFinish({ object, error }) {
      if (process.env.NODE_ENV !== 'production') {
        if (error) console.error('[streamObject] schema validation error:', error);
        else console.log('[streamObject] finished:', object?.metadata?.title);
      }
    },
  });

  // Stream partial objects as newline-delimited JSON (NDJSON).
  // Each line is a deeper partial of RecipeOutput as the model fills in fields:
  //   {"metadata":{"title":"..."}}                 ← first line
  //   {"metadata":{...},"ingredients":[...]}       ← second line
  //   {"metadata":{...},"ingredients":[...],...}   ← ...
  // The RN client reads each line and updates the UI progressively.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const partial of result.partialObjectStream) {
          controller.enqueue(encoder.encode(JSON.stringify(partial) + '\n'));
        }
      } catch (err) {
        // Send error as a final NDJSON line so the client can surface it
        controller.enqueue(
          encoder.encode(
            JSON.stringify({ __error: err instanceof Error ? err.message : 'stream failed' }) + '\n',
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Transfer-Encoding': 'chunked',
      'X-Model-Used': modelId,
      ...CORS,
    },
  });
}

// ─── helpers ─────────────────────────────────────────────────────────────────

async function prefetchImage(dishName: string): Promise<string> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return pollinationsUrl(dishName);

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(dishName + ' food photography')}&per_page=1&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` }, signal: AbortSignal.timeout(3_000) },
    );
    if (!res.ok) return pollinationsUrl(dishName);
    const data = (await res.json()) as { results: Array<{ urls: { regular: string } }> };
    return data.results[0]?.urls.regular ?? pollinationsUrl(dishName);
  } catch {
    return pollinationsUrl(dishName);
  }
}

function pollinationsUrl(dishName: string): string {
  const prompt = `professional food photography of ${dishName}, appetizing, warm lighting`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&seed=${Date.now()}`;
}

function buildStructuredPrompt(
  ingredients: string[],
  prefs: { dietary: string; servings: number; timeAvailableMinutes: number; skillLevel: string; allergies: string[]; includeAlcohol: boolean },
  cuisineHint: string | undefined,
  imageUrl: string,
): string {
  const allergyLine = prefs.allergies.length
    ? `\nAllergens to flag in warnings.allergens: ${prefs.allergies.join(', ')}`
    : '';

  return `Generate one complete recipe using these ingredients: ${ingredients.join(', ')}.
${cuisineHint ? `Cuisine style: ${cuisineHint}` : ''}
Dietary: ${prefs.dietary} | Servings: ${prefs.servings} | Max time: ${prefs.timeAvailableMinutes} min | Skill: ${prefs.skillLevel}${allergyLine}
Include alcohol pairings: ${prefs.includeAlcohol}

Set imageUrl to: "${imageUrl}"

Fill every field of the schema. For warnings.skillWarnings include any techniques that might be difficult for a ${prefs.skillLevel} cook.`;
}
