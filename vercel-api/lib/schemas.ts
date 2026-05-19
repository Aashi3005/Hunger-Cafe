import { z } from 'zod';

// ─── Shared enums ────────────────────────────────────────────────────────────

export const DietaryRequirement = z.enum([
  'vegan',
  'vegetarian',
  'jain',
  'gluten-free',
  'keto',
  'diabetic',
  'none',
]);
export type DietaryRequirement = z.infer<typeof DietaryRequirement>;

export const SkillLevel = z.enum(['beginner', 'intermediate', 'advanced']);
export type SkillLevel = z.infer<typeof SkillLevel>;

export const ImageStyle = z.enum(['realistic', 'professional']);
export type ImageStyle = z.infer<typeof ImageStyle>;

// ─── Request body ────────────────────────────────────────────────────────────

export const UserPreferencesSchema = z.object({
  dietary: DietaryRequirement.default('none'),
  allergies: z.array(z.string()).default([]),
  skillLevel: SkillLevel.default('intermediate'),
  timeAvailableMinutes: z.number().int().positive().max(480).default(60),
  servings: z.number().int().min(1).max(20).default(4),
  includeAlcohol: z.boolean().default(false),
  equipment: z.array(z.string()).default([]),
});
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

export const RecipeRequestSchema = z.object({
  ingredients: z
    .union([
      z.array(z.string().min(1)).min(1).max(30),
      // Accept legacy comma-separated string from older RN client
      z.string().min(1).transform(s =>
        s.split(',').map(i => i.trim()).filter(Boolean),
      ),
    ])
    .pipe(z.array(z.string()).min(1)),
  userPreferences: UserPreferencesSchema.default({}),
  cuisineHint: z.string().optional(),
  // Which AI provider to use. 'auto' picks the best available one.
  modelPreference: z
    .enum(['gateway-claude-haiku', 'gateway-claude-sonnet', 'gateway-gemini', 'auto'])
    .default('auto'),
});
export type RecipeRequest = z.infer<typeof RecipeRequestSchema>;

// ─── Tool parameter schemas ───────────────────────────────────────────────────

export const FetchDishImageParams = z.object({
  dishName: z.string().min(1).describe('Name of the dish to search'),
  style: ImageStyle.default('professional').describe(
    'realistic = home-cooked feel, professional = magazine/studio quality',
  ),
});

export const GenerateDishImageParams = z.object({
  dishName: z.string().min(1),
  ingredients: z
    .array(z.string())
    .max(5)
    .describe('Top 3-5 ingredients to include in the visual'),
  style: ImageStyle.default('professional'),
});

export const FilterDietaryParams = z.object({
  ingredients: z.array(z.string()).min(1),
  dietaryRequirement: DietaryRequirement,
});

export const IngredientWithQty = z.object({
  name: z.string(),
  quantity: z.number().positive(),
  unit: z.string().describe('e.g. cup, tbsp, g, piece'),
});
export type IngredientWithQty = z.infer<typeof IngredientWithQty>;

export const ScaleServingsParams = z.object({
  currentServings: z.number().int().positive(),
  targetServings: z.number().int().positive(),
  ingredients: z.array(IngredientWithQty),
});

export const RecipeStepForTime = z.object({
  description: z.string(),
  estimatedMinutes: z.number().positive(),
});

export const CheckTimeConstraintParams = z.object({
  maxMinutes: z.number().int().positive(),
  recipeSteps: z.array(RecipeStepForTime).min(1),
});

export const CheckAllergiesParams = z.object({
  ingredients: z.array(z.string()).min(1),
  userAllergies: z.array(z.string()).min(1),
});

export const CheckEquipmentParams = z.object({
  requiredEquipment: z.array(z.string()).min(1),
  userEquipment: z.array(z.string()),
});

export const SuggestDrinkPairingParams = z.object({
  dishName: z.string().min(1),
  cuisineType: z.string().min(1),
  isVegetarian: z.boolean(),
  includeAlcohol: z.boolean().default(false),
});

// ─── streamObject output schema (Phase 2) ────────────────────────────────────

export const RecipeOutputSchema = z.object({
  metadata: z.object({
    title: z.string(),
    cuisine: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    prepTimeMinutes: z.number(),
    cookTimeMinutes: z.number(),
    totalTimeMinutes: z.number(),
    servings: z.number(),
    skillLevel: z.enum(['beginner', 'intermediate', 'expert']),
  }),

  ingredients: z.array(
    z.object({
      name: z.string(),
      quantity: z.string(),
      unit: z.string(),
      category: z.enum(['vegetables', 'dairy', 'spices', 'grains', 'protein', 'other']),
      optional: z.boolean(),
      substitutes: z.array(z.string()).optional(),
    }),
  ),

  nutrition: z.object({
    perServing: z.object({
      calories: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
      fiber: z.number(),
      sugar: z.number(),
    }),
    dietaryTags: z.array(z.string()),
  }),

  steps: z.array(
    z.object({
      stepNumber: z.number(),
      title: z.string(),
      instruction: z.string(),
      durationMinutes: z.number(),
      technique: z.string().optional(),
      temperature: z.string().optional(),
      tips: z.array(z.string()).optional(),
      visualCue: z.string().optional(),
    }),
  ),

  pairings: z.object({
    drinks: z.array(
      z.object({
        name: z.string(),
        type: z.enum(['alcoholic', 'non-alcoholic']),
        reason: z.string(),
      }),
    ),
    sides: z.array(z.string()),
  }),

  warnings: z.object({
    allergens: z.array(z.string()),
    dietaryFlags: z.array(z.string()),
    skillWarnings: z.array(z.string()),
  }),

  imageUrl: z.string().optional(),
});

export type RecipeOutput = z.infer<typeof RecipeOutputSchema>;
