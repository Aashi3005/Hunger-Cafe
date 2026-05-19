import { tool } from 'ai';
import { z } from 'zod';
import { CheckEquipmentParams } from '../schemas';

// For each piece of equipment, list what you can do instead without it
const ALTERNATIVES: Record<string, string[]> = {
  'pressure cooker': [
    'Use a heavy-bottomed pot with a tight lid — increase cook time by 2–3x',
    'Soak legumes overnight to cut boiling time significantly',
  ],
  'blender': [
    'Use an immersion (hand) blender directly in the pot',
    'Mash with a fork or potato masher for a rustic texture',
    'Grind in a mortar and pestle for small quantities',
  ],
  'food processor': [
    'Chop finely by hand — takes 5–10 extra minutes',
    'Use a box grater for vegetables like carrots and beets',
  ],
  'oven': [
    'Cover pan and use stovetop on low heat for a similar effect',
    'Use a kadai/wok with a lid and place a metal stand inside to elevate the dish (makeshift oven)',
    'Air fryer works for roasting and baking at smaller scales',
  ],
  'stand mixer': [
    'Use a hand electric mixer',
    'Whisk vigorously by hand — more effort, same result for most recipes',
  ],
  'hand mixer': [
    'Whisk by hand — effective for small batches',
  ],
  'grill': [
    'Use a cast iron skillet on high heat for char marks',
    'Broil in oven (top heating element) for a similar charred finish',
  ],
  'steamer': [
    'Place food in a colander over a pot of boiling water, cover with lid',
    'Use a microwave with a splash of water in a covered dish',
  ],
  'rolling pin': [
    'Use a smooth bottle or glass to roll dough',
  ],
  'wok': [
    "A wide, heavy-bottomed skillet works — the high sides of a wok help with tossing, but aren't essential",
  ],
  'thermometer': [
    'Test oil temperature with a wooden chopstick — bubbles form around it when ready (~170°C)',
    'For bread, tap the bottom — a hollow sound means done',
  ],
};

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function findMissing(required: string[], available: string[]): string[] {
  const availableNorm = available.map(normalize);
  return required.filter(req => {
    const reqNorm = normalize(req);
    return !availableNorm.some(a => a.includes(reqNorm) || reqNorm.includes(a));
  });
}

function getAlternatives(missing: string[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const item of missing) {
    const norm = normalize(item);
    for (const [equip, alts] of Object.entries(ALTERNATIVES)) {
      if (norm.includes(equip) || equip.includes(norm)) {
        result[item] = alts;
        break;
      }
    }
    // If no match found, give a generic suggestion
    if (!result[item]) {
      result[item] = [`No direct alternative found — improvise or skip this step if non-critical`];
    }
  }
  return result;
}

export const checkEquipment = tool({
  description:
    'Check if the user has the required kitchen equipment and suggest alternatives for missing items.',
  inputSchema: CheckEquipmentParams,
  execute: async ({ requiredEquipment, userEquipment }: z.infer<typeof CheckEquipmentParams>) => {
    const missing = findMissing(requiredEquipment, userEquipment);
    const hasAll = missing.length === 0;
    const alternatives = hasAll ? {} : getAlternatives(missing);

    return {
      hasAll,
      missing,
      alternatives,
      ...(hasAll
        ? { message: 'User has all required equipment.' }
        : {
            note: 'Recipe can still be made with the alternatives listed above.',
          }),
    };
  },
});
