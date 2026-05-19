import { tool } from 'ai';
import { z } from 'zod';
import { CheckTimeConstraintParams } from '../schemas';

// Shortcuts the AI can suggest when a recipe runs over time
const SHORTCUT_RULES: Array<{
  keyword: string;
  shortcut: string;
  savedMinutes: number;
}> = [
  {
    keyword: 'marinate',
    shortcut: 'Reduce marination to 15 min with a fork-scored surface and acid (lemon/vinegar)',
    savedMinutes: 30,
  },
  {
    keyword: 'pressure cook',
    shortcut: 'Use a pressure cooker to cut cooking time by ~60%',
    savedMinutes: 20,
  },
  {
    keyword: 'slow cook',
    shortcut: 'Use high heat and reduce liquid instead of slow cooking',
    savedMinutes: 60,
  },
  {
    keyword: 'soak',
    shortcut: 'Use hot water soaking (30 min) instead of overnight',
    savedMinutes: 480,
  },
  {
    keyword: 'boil',
    shortcut: 'Start with boiling water from a kettle to save 5–8 min',
    savedMinutes: 7,
  },
  {
    keyword: 'caramelise',
    shortcut: 'Add a pinch of sugar to speed up caramelisation',
    savedMinutes: 10,
  },
  {
    keyword: 'chop',
    shortcut: 'Use a food processor or buy pre-chopped vegetables',
    savedMinutes: 10,
  },
];

export const checkTimeConstraint = tool({
  description:
    "Check whether a recipe fits within the user's available time and suggest shortcuts if it does not.",
  inputSchema: CheckTimeConstraintParams,
  execute: async ({ maxMinutes, recipeSteps }: z.infer<typeof CheckTimeConstraintParams>) => {
    const estimatedTime = recipeSteps.reduce(
      (sum, s) => sum + s.estimatedMinutes,
      0,
    );

    if (estimatedTime <= maxMinutes) {
      return {
        fitsConstraint: true,
        estimatedTime,
        maxMinutes,
        optimizations: [],
      };
    }

    const overBy = estimatedTime - maxMinutes;
    const optimizations: string[] = [];
    let potentialSaving = 0;

    for (const step of recipeSteps) {
      const desc = step.description.toLowerCase();
      for (const rule of SHORTCUT_RULES) {
        if (desc.includes(rule.keyword) && !optimizations.includes(rule.shortcut)) {
          optimizations.push(rule.shortcut);
          potentialSaving += rule.savedMinutes;
        }
      }
    }

    // Generic fallback shortcuts if specific ones don't cover enough time
    if (potentialSaving < overBy) {
      optimizations.push(
        'Prep all ingredients before cooking (mise en place) to save context-switching time',
        'Do parallel tasks: boil water while chopping, preheat pan while measuring spices',
      );
    }

    return {
      fitsConstraint: false,
      estimatedTime,
      maxMinutes,
      overBy,
      optimizations,
      note: `Recipe is ~${overBy} min over budget. Apply shortcuts to bring it under ${maxMinutes} min.`,
    };
  },
});
