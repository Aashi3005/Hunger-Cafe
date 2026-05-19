import { tool } from 'ai';
import { z } from 'zod';
import { CheckAllergiesParams } from '../schemas';

// Hidden sources the user might not think of — where a common allergen hides
// Key: allergen token, Value: list of sneaky ingredient patterns that contain it
const HIDDEN_SOURCES: Record<string, string[]> = {
  nut: [
    'curry paste (often contains peanuts)',
    'satay sauce (peanut-based)',
    'mole sauce (contains almonds/peanuts)',
    'certain gravies and kormas (cashew paste base)',
    'pesto (pine nuts)',
    'bread crumbs from bakeries (cross-contamination)',
  ],
  peanut: [
    'curry paste', 'satay sauce', 'mole', 'chikki', 'certain chutneys',
    'some South Indian podis (peanut powder)', 'groundnut oil',
  ],
  gluten: [
    'soy sauce (contains wheat)',
    'miso paste (barley-based)',
    'worcestershire sauce',
    'certain spice blends and masalas (flour used as anti-caking agent)',
    'imitation crab meat',
    'beer-battered items',
  ],
  dairy: [
    'bread and naan (sometimes contains milk solids)',
    'chips/crisps (cream & onion flavouring)',
    'store-bought gravies and dals (cream added)',
    'some margarines (whey content)',
    'dark chocolate (may contain milk traces)',
  ],
  egg: [
    'mayonnaise', 'aioli', 'some breads and pastries',
    'pasta (egg pasta)',
    'store-bought noodles',
    'some veggie burger patties (egg as binder)',
  ],
  soy: [
    'tofu', 'tempeh', 'edamame', 'miso', 'soy sauce', 'hoisin sauce',
    'teriyaki sauce', 'some protein powders',
  ],
  fish: [
    'Worcestershire sauce (anchovies)',
    'Caesar dressing (anchovies)',
    'some Asian sauces (fish sauce base)',
    'certain Pad Thai sauces',
  ],
  shellfish: [
    'stock cubes (some seafood variety)',
    'some Asian pastes (shrimp paste)',
    'prawn crackers',
    'surf and turf marinades',
  ],
};

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function detectConflicts(
  ingredients: string[],
  userAllergies: string[],
): string[] {
  const conflicts: string[] = [];

  for (const allergy of userAllergies) {
    const allergyNorm = normalize(allergy);
    for (const ing of ingredients) {
      const ingNorm = normalize(ing);
      if (
        ingNorm.includes(allergyNorm) ||
        allergyNorm.includes(ingNorm)
      ) {
        conflicts.push(`"${ing}" contains ${allergy}`);
      }
    }
  }

  return [...new Set(conflicts)];
}

function detectHiddenSources(
  ingredients: string[],
  userAllergies: string[],
): string[] {
  const hidden: string[] = [];

  for (const allergy of userAllergies) {
    const allergyNorm = normalize(allergy);
    for (const [allergenKey, sources] of Object.entries(HIDDEN_SOURCES)) {
      if (allergyNorm.includes(allergenKey) || allergenKey.includes(allergyNorm)) {
        for (const ing of ingredients) {
          const ingNorm = normalize(ing);
          for (const source of sources) {
            if (source.toLowerCase().includes(ingNorm.split(' ')[0])) {
              hidden.push(source);
            }
          }
        }
      }
    }
  }

  return [...new Set(hidden)];
}

export const checkAllergies = tool({
  description:
    'Cross-reference recipe ingredients against user allergies including hidden allergen sources. Always call this when the user has allergies.',
  inputSchema: CheckAllergiesParams,
  execute: async ({ ingredients, userAllergies }: z.infer<typeof CheckAllergiesParams>) => {
    const conflicts = detectConflicts(ingredients, userAllergies);
    const hiddenSources = detectHiddenSources(ingredients, userAllergies);
    const safe = conflicts.length === 0;

    return {
      safe,
      conflicts,
      hiddenSources,
      ...(safe && hiddenSources.length === 0
        ? { message: 'Recipe is safe for all listed allergies.' }
        : {
            warning:
              'Review conflicts and hidden sources before cooking. Substitute or remove flagged ingredients.',
          }),
    };
  },
});
