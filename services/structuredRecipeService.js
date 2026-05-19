import { VERCEL_API_URL } from '@/config/apiConfig';

const VALID_DIETARY = ['vegan', 'vegetarian', 'jain', 'gluten-free', 'keto', 'diabetic'];

function mapDietary(input) {
  const norm = (input || '').toLowerCase().trim();
  return VALID_DIETARY.includes(norm) ? norm : 'none';
}

function parseMinutes(input) {
  if (!input) return 60;
  const num = parseInt(input);
  return isNaN(num) ? 60 : Math.min(480, Math.max(10, num));
}

/**
 * Stream a single structured recipe from /api/recipe-structured.
 *
 * The endpoint sends NDJSON — each line is a deeper partial of the RecipeOutput
 * schema. This lets the UI render fields as soon as they arrive.
 *
 * @param {object} params
 * @param {string} params.ingredients  comma-separated or array
 * @param {string} [params.cuisineType]
 * @param {string} [params.dietaryNeeds]
 * @param {string} [params.cookingTime]
 * @param {string|number} [params.servings]
 * @param {function} [params.onPartial]  called with each partial RecipeOutput
 * @returns {Promise<object>} the final complete RecipeOutput
 */
export async function generateStructuredRecipe({
  ingredients,
  cuisineType,
  dietaryNeeds,
  cookingTime,
  servings,
  onPartial,
}) {
  const url = `${VERCEL_API_URL}/api/recipe-structured`;

  const body = {
    ingredients,
    cuisineHint: cuisineType || undefined,
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
    const text = await response.text();
    throw new Error(`recipe-structured API ${response.status}: ${text}`);
  }

  let lastPartial = null;

  if (response.body && typeof response.body.getReader === 'function') {
    // NDJSON streaming — each line is a partial object
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Split on newlines — each complete line is one NDJSON record
      const lines = buffer.split('\n');
      // Keep the last (possibly incomplete) line in the buffer
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const partial = JSON.parse(trimmed);

          if (partial.__error) {
            throw new Error(`Server error: ${partial.__error}`);
          }

          lastPartial = partial;
          if (onPartial) onPartial(partial);
        } catch (parseErr) {
          // Malformed line — skip and continue; don't abort the stream
          console.warn('[structuredRecipeService] skipped malformed line:', trimmed);
        }
      }
    }
  } else {
    // Fallback: read all at once (no progressive rendering)
    const text = await response.text();
    const lines = text.split('\n').filter(l => l.trim());
    for (const line of lines) {
      try {
        const partial = JSON.parse(line);
        if (partial.__error) throw new Error(partial.__error);
        lastPartial = partial;
        if (onPartial) onPartial(partial);
      } catch { /* skip */ }
    }
  }

  if (!lastPartial) throw new Error('No data received from recipe-structured endpoint');
  return lastPartial;
}
