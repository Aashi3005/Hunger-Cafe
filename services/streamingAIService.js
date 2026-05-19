import { VERCEL_API_URL } from '@/config/apiConfig';

const IMAGE_BASE = 'https://image.pollinations.ai/prompt';

const VALID_DIETARY = ['vegan', 'vegetarian', 'jain', 'gluten-free', 'keto', 'diabetic'];

// Map free-text dietary input to the enum the backend accepts
function mapDietary(input) {
  const norm = (input || '').toLowerCase().trim();
  return VALID_DIETARY.includes(norm) ? norm : 'none';
}

// Parse "30 min" / "30 minutes" / "30" → integer minutes
function parseMinutes(input) {
  if (!input) return 60;
  const num = parseInt(input);
  return isNaN(num) ? 60 : Math.min(480, Math.max(10, num));
}

function recipeImageUrl(recipeName, cuisine) {
  const prompt = `professional food photography of ${recipeName}${cuisine ? `, ${cuisine} cuisine` : ''}, appetizing, restaurant style, warm lighting`;
  return `${IMAGE_BASE}/${encodeURIComponent(prompt)}?width=400&height=400&seed=${Date.now()}`;
}

function decorateRecipes(recipes) {
  return recipes.map((recipe, index) => ({
    ...recipe,
    id: `stream_${Date.now()}_${index}`,
    ratingCount: Math.floor(Math.random() * 500) + 100,
    title: recipe.recipeName,
    imageUrl: recipeImageUrl(recipe.recipeName, recipe.cuisine),
  }));
}

function parseRecipesFromText(text) {
  const clean = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  const parsed = JSON.parse(clean);
  if (!Array.isArray(parsed)) throw new Error('Expected JSON array from API');
  return parsed;
}

/**
 * Stream recipes from the Vercel edge function.
 *
 * @param {string} ingredients
 * @param {string} cuisineType
 * @param {string} dietaryNeeds
 * @param {string} cookingTime
 * @param {string} servings
 * @param {(partialText: string, bytesReceived: number) => void} onChunk
 * @param {string} [modelPreference='auto'] — 'auto' | 'gemini-2.0-flash' | 'gpt-4o-mini' | 'claude-haiku' | 'mistral-small' | etc.
 * @returns {Promise<Array>} fully decorated recipe array
 */
export async function generateRecipesStreaming(
  ingredients,
  cuisineType,
  dietaryNeeds,
  cookingTime,
  servings,
  onChunk,
  modelPreference = 'gateway-claude-haiku'
) {
  const url = `${VERCEL_API_URL}/api/recipe`;
  console.log('🌐 Hitting backend URL:', url, '| model:', modelPreference);

  // Map legacy flat fields → new nested userPreferences schema
  const body = {
    ingredients, // Zod schema handles string → array transform on backend
    cuisineHint: cuisineType || undefined,
    modelPreference,
    userPreferences: {
      dietary: mapDietary(dietaryNeeds),
      timeAvailableMinutes: parseMinutes(cookingTime),
      servings: parseInt(servings) || 4,
      skillLevel: 'intermediate',
      allergies: [],
      includeAlcohol: false,
      equipment: [],
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API ${response.status}: ${body}`);
  }

  // ReadableStream supported in RN 0.73+ / Hermes
  if (response.body && typeof response.body.getReader === 'function') {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let bytesReceived = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;
      bytesReceived += value.byteLength;
      if (onChunk) onChunk(fullText, bytesReceived);
    }

    const recipes = parseRecipesFromText(fullText);
    return decorateRecipes(recipes);
  }

  // Fallback: read full response at once (no streaming UI in this case)
  const text = await response.text();
  if (onChunk) onChunk(text, text.length);
  const recipes = parseRecipesFromText(text);
  return decorateRecipes(recipes);
}

/**
 * Returns all AI providers currently configured on the backend.
 * Use this to show a model-picker in Settings or to log which AI is active.
 *
 * @returns {Promise<{models: Array<{id,label,speedMs}>, default: string|null}>}
 */
export async function fetchAvailableModels() {
  try {
    const res = await fetch(`${VERCEL_API_URL}/api/models`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn('[streamingAIService] fetchAvailableModels failed:', e.message);
    return { models: [], default: null };
  }
}

/**
 * Ping the health endpoint to confirm the backend is reachable.
 */
export async function pingBackend() {
  try {
    const res = await fetch(`${VERCEL_API_URL}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    const json = await res.json();
    return { ok: true, ...json };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
