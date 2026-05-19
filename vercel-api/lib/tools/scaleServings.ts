import { tool } from 'ai';
import { z } from 'zod';
import { ScaleServingsParams, type IngredientWithQty } from '../schemas';

// Spices and strongly-flavoured ingredients need dampened scaling above 4x —
// doubling a recipe shouldn't double the chilli powder, or it becomes inedible.
const SPICE_TOKENS = [
  'chilli', 'chili', 'pepper', 'cumin', 'coriander', 'turmeric', 'haldi',
  'garam masala', 'clove', 'cardamom', 'cinnamon', 'bay leaf', 'star anise',
  'mustard seed', 'fenugreek', 'methi', 'asafoetida', 'hing', 'nutmeg',
  'mace', 'paprika', 'cayenne', 'saffron', 'salt',
];

function isSpice(ingredientName: string): boolean {
  const norm = ingredientName.toLowerCase();
  return SPICE_TOKENS.some(t => norm.includes(t));
}

function scaleQuantity(
  qty: number,
  ratio: number,
  ingredientName: string,
): number {
  if (ratio <= 4 || !isSpice(ingredientName)) {
    return parseFloat((qty * ratio).toFixed(2));
  }
  // Spice dampening above 4x: use 75% of linear amount
  // This prevents over-seasoning at large batch sizes
  return parseFloat((qty * ratio * 0.75).toFixed(2));
}

function formatQty(qty: number): string {
  // Convert floats like 0.333 → "1/3", 0.5 → "1/2" for readability
  const fractions: Array<[number, string]> = [
    [0.25, '¼'], [0.33, '⅓'], [0.5, '½'], [0.67, '⅔'], [0.75, '¾'],
  ];
  const remainder = qty % 1;
  const whole = Math.floor(qty);

  for (const [val, symbol] of fractions) {
    if (Math.abs(remainder - val) < 0.04) {
      return whole > 0 ? `${whole} ${symbol}` : symbol;
    }
  }
  return qty % 1 === 0 ? `${qty}` : qty.toFixed(1);
}

export const scaleServings = tool({
  description:
    'Scale ingredient quantities from one serving count to another. Handles non-linear scaling for spices to prevent over-seasoning.',
  inputSchema: ScaleServingsParams,
  execute: async ({ currentServings, targetServings, ingredients }: z.infer<typeof ScaleServingsParams>) => {
    const ratio = targetServings / currentServings;

    const scaledIngredients = ingredients.map((ing: IngredientWithQty) => {
      const scaledQty = scaleQuantity(ing.quantity, ratio, ing.name);
      return {
        name: ing.name,
        originalQty: `${formatQty(ing.quantity)} ${ing.unit}`,
        scaledQty: `${formatQty(scaledQty)} ${ing.unit}`,
        isSpice: isSpice(ing.name),
        scalingNote:
          isSpice(ing.name) && ratio > 4
            ? 'Scaled at 75% to prevent over-seasoning — taste and adjust'
            : null,
      };
    });

    return {
      currentServings,
      targetServings,
      scalingRatio: parseFloat(ratio.toFixed(2)),
      scaledIngredients,
    };
  },
});
