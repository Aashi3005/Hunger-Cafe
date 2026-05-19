import { tool } from 'ai';
import { z } from 'zod';
import { FilterDietaryParams, type DietaryRequirement } from '../schemas';

// ─── Violation databases ──────────────────────────────────────────────────────
// Each set contains normalized ingredient tokens that indicate a violation.
// Matching is substring-based (e.g. "chicken stock" matches "chicken").

const VIOLATIONS: Record<Exclude<DietaryRequirement, 'none'>, string[]> = {
  vegan: [
    'meat', 'beef', 'pork', 'lamb', 'chicken', 'turkey', 'duck', 'fish',
    'prawn', 'shrimp', 'lobster', 'crab', 'egg', 'milk', 'butter', 'ghee',
    'cream', 'cheese', 'paneer', 'curd', 'yogurt', 'dahi', 'honey',
    'lard', 'gelatin', 'whey', 'casein', 'mayonnaise',
  ],
  vegetarian: [
    'meat', 'beef', 'pork', 'lamb', 'chicken', 'turkey', 'duck',
    'fish', 'prawn', 'shrimp', 'lobster', 'crab', 'gelatin', 'lard',
  ],
  jain: [
    // Jain: no root vegetables + no meat/egg
    'onion', 'garlic', 'potato', 'aloo', 'carrot', 'gajar', 'beet',
    'beetroot', 'radish', 'mooli', 'turnip', 'leek', 'shallot', 'ginger',
    'adrak', 'scallion', 'spring onion',
    'meat', 'beef', 'pork', 'lamb', 'chicken', 'fish', 'prawn', 'egg',
  ],
  'gluten-free': [
    'wheat', 'flour', 'maida', 'atta', 'bread', 'pasta', 'noodle',
    'barley', 'jau', 'rye', 'semolina', 'sooji', 'rava', 'suji',
    'bulgur', 'couscous', 'farro', 'spelt', 'soy sauce', 'seitan',
  ],
  keto: [
    'rice', 'chawal', 'potato', 'aloo', 'bread', 'roti', 'chapati',
    'naan', 'puri', 'pasta', 'noodle', 'sugar', 'jaggery', 'gur',
    'corn', 'maize', 'banana', 'mango', 'apple', 'grape', 'oat',
    'bean', 'rajma', 'chickpea', 'chana', 'lentil', 'dal', 'flour', 'maida',
  ],
  diabetic: [
    'sugar', 'refined flour', 'maida', 'white rice', 'corn syrup',
    'honey', 'jaggery', 'gur', 'candy', 'chocolate syrup', 'glucose',
    'maltose', 'dextrose',
  ],
};

// Suggestions to replace common violating ingredients
const SUGGESTIONS: Record<string, string> = {
  onion: 'Use asafoetida (hing) for flavour instead of onion',
  garlic: 'Use hing and cumin for similar depth',
  potato: 'Try raw banana (kachcha kela) or yam as a starchy substitute',
  egg: 'Flaxseed egg (1 tbsp ground flax + 3 tbsp water) works as a binder',
  milk: 'Use oat milk, almond milk, or coconut milk',
  butter: 'Use coconut oil or vegan butter',
  ghee: 'Use refined coconut oil for a similar richness',
  paneer: 'Firm tofu works well with similar spicing',
  rice: 'Cauliflower rice keeps it keto-friendly',
  flour: 'Almond flour or coconut flour for gluten-free/keto baking',
  sugar: 'Stevia or erythritol for diabetic-safe sweetness',
  pasta: 'Zucchini noodles or shirataki noodles for keto',
};

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function findViolations(ingredients: string[], requirement: Exclude<DietaryRequirement, 'none'>) {
  const violations: string[] = [];
  const list = VIOLATIONS[requirement];

  for (const ing of ingredients) {
    const norm = normalize(ing);
    for (const v of list) {
      if (norm.includes(v) && !violations.includes(ing)) {
        violations.push(ing);
      }
    }
  }
  return violations;
}

function buildSuggestions(violations: string[]): string[] {
  const result: string[] = [];
  for (const v of violations) {
    const norm = normalize(v);
    for (const [key, suggestion] of Object.entries(SUGGESTIONS)) {
      if (norm.includes(key)) {
        result.push(suggestion);
        break;
      }
    }
  }
  return [...new Set(result)]; // dedupe
}

export const filterDietary = tool({
  description:
    'Validate whether a list of ingredients satisfies a dietary requirement. Always call this when the user has a dietary restriction.',
  inputSchema: FilterDietaryParams,
  execute: async ({ ingredients, dietaryRequirement }: z.infer<typeof FilterDietaryParams>) => {
    if (dietaryRequirement === 'none') {
      return { passes: true, violations: [], suggestions: [] };
    }

    const violations = findViolations(ingredients, dietaryRequirement);
    const passes = violations.length === 0;

    return {
      passes,
      violations,
      suggestions: passes ? [] : buildSuggestions(violations),
    };
  },
});
