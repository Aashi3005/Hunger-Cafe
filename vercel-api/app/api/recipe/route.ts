import { streamText, stepCountIs } from 'ai';
import { ZodError } from 'zod';
import { RecipeRequestSchema } from '../../../lib/schemas';
import { buildSystemPrompt, buildUserPrompt } from '../../../lib/prompts';
import { checkRateLimit, getRateLimitKey } from '../../../lib/rateLimit';
import { selectModel } from '../../../lib/models';
import {
  fetchDishImage,
  generateDishImage,
  filterDietary,
  scaleServings,
  checkTimeConstraint,
  checkAllergies,
  checkEquipment,
  suggestDrinkPairing,
} from '../../../lib/tools';

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
    return errorResponse(
      429,
      `Rate limit exceeded. Retry after ${new Date(rl.resetAt).toISOString()}`,
    );
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
      return errorResponse(
        400,
        `Validation: ${err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
      );
    }
    return errorResponse(400, 'Bad request');
  }

  const { ingredients, userPreferences, cuisineHint, modelPreference } = parsed;
  const { model, id: modelId, label: modelLabel } = selectModel(modelPreference);

  console.log(`[recipe] using model: ${modelId} (${modelLabel})`);

  // ── Stream ─────────────────────────────────────────────────────────────────
  let result;
  try {
    result = streamText({
      model,
      system: buildSystemPrompt(userPreferences),
      prompt: buildUserPrompt(ingredients, cuisineHint),
      temperature: 0.7,
      maxOutputTokens: 4096,
      stopWhen: stepCountIs(3),
      tools: {
        fetchDishImage,
        generateDishImage,
        filterDietary,
        scaleServings,
        checkTimeConstraint,
        checkAllergies,
        checkEquipment,
        suggestDrinkPairing,
      },
      abortSignal: req.signal,
      onStepFinish({ toolCalls, toolResults, usage }) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[step]', { tools: toolCalls?.map(t => t.toolName), tokens: usage });
          if (toolResults?.length) console.log('[tool results]', JSON.stringify(toolResults, null, 2));
        }
      },
    });
  } catch (err: any) {
    const is429 = err?.message?.includes('429') || err?.message?.includes('quota') || err?.status === 429;
    return errorResponse(is429 ? 429 : 500, is429 ? 'AI quota exceeded — try again later.' : err?.message ?? 'AI error');
  }

  // Catch quota/auth errors that surface during streaming (before first token)
  const stream = result.toTextStreamResponse({ headers: { ...CORS, 'X-Model-Used': modelId } });

  // If the provider returned a non-2xx, surface it immediately instead of hanging
  if (!stream.ok) {
    const body = await stream.text().catch(() => 'stream error');
    const is429 = stream.status === 429 || body.includes('quota');
    return errorResponse(is429 ? 429 : stream.status, is429 ? 'AI quota exceeded — try again later.' : body);
  }

  return stream;
}
