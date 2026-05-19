import { tool } from 'ai';
import { z } from 'zod';
import { GenerateDishImageParams } from '../schemas';

function buildPrompt(dishName: string, ingredients: string[], style: string): string {
  const styleClause =
    style === 'professional'
      ? 'professional food photography, studio lighting, clean white plate, Michelin-star plating'
      : 'rustic home cooking photo, natural window light, wooden table';

  const ingredientClause =
    ingredients.length > 0
      ? ` featuring ${ingredients.slice(0, 3).join(', ')}`
      : '';

  return `${dishName}${ingredientClause}, ${styleClause}, high resolution, food magazine quality, appetizing`;
}

export const generateDishImage = tool({
  description:
    'Generate a unique AI dish image via Pollinations. Use for fusion dishes, unusual combinations, or when fetchDishImage found nothing useful.',
  inputSchema: GenerateDishImageParams,
  execute: async ({ dishName, ingredients, style }: z.infer<typeof GenerateDishImageParams>) => {
    const prompt = buildPrompt(dishName, ingredients, style);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${Date.now()}`;
    return { imageUrl, promptUsed: prompt };
  },
});
