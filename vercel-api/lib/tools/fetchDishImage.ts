import { tool } from 'ai';
import { z } from 'zod';
import { FetchDishImageParams } from '../schemas';

// Pollinations is free, no key needed — used as the fallback
function pollinationsFallback(dishName: string): string {
  const prompt = `professional food photography of ${dishName}, appetizing, warm lighting, restaurant quality`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&seed=${Date.now()}`;
}

export const fetchDishImage = tool({
  description:
    'Fetch a real food photograph from Unsplash. Use for popular, well-known dishes. Falls back to a generated image if Unsplash has no results.',
  inputSchema: FetchDishImageParams,
  execute: async ({ dishName, style }: z.infer<typeof FetchDishImageParams>) => {
    const key = process.env.UNSPLASH_ACCESS_KEY;

    if (!key) {
      // No API key configured — skip straight to fallback
      return {
        imageUrl: pollinationsFallback(dishName),
        photographer: 'AI generated',
        sourceUrl: null,
        note: 'UNSPLASH_ACCESS_KEY not set — using generated image',
      };
    }

    const query =
      style === 'professional'
        ? `${dishName} food photography plating`
        : `${dishName} homemade dish`;

    const endpoint = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape&content_filter=high`;

    try {
      const res = await fetch(endpoint, {
        headers: { Authorization: `Client-ID ${key}` },
        // Abort if Unsplash is slow — don't hold up the stream
        signal: AbortSignal.timeout(4_000),
      });

      if (!res.ok) {
        return {
          imageUrl: pollinationsFallback(dishName),
          photographer: 'AI generated',
          sourceUrl: null,
          error: `Unsplash returned ${res.status}`,
        };
      }

      const data = (await res.json()) as {
        results: Array<{
          urls: { regular: string };
          user: { name: string };
          links: { html: string };
        }>;
      };

      if (!data.results.length) {
        return {
          imageUrl: pollinationsFallback(dishName),
          photographer: 'AI generated',
          sourceUrl: null,
          note: 'No Unsplash results — using generated image',
        };
      }

      const photo = data.results[0];
      return {
        imageUrl: photo.urls.regular,
        photographer: photo.user.name,
        sourceUrl: photo.links.html,
      };
    } catch (err) {
      return {
        imageUrl: pollinationsFallback(dishName),
        photographer: 'AI generated',
        sourceUrl: null,
        error: err instanceof Error ? err.message : 'Network error',
      };
    }
  },
});
