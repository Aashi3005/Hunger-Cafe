import { tool } from 'ai';
import { z } from 'zod';
import { SuggestDrinkPairingParams } from '../schemas';

interface Pairing {
  drink: string;
  reason: string;
  type: 'alcoholic' | 'non-alcoholic';
}

// ─── Pairing database ─────────────────────────────────────────────────────────

const CUISINE_PAIRINGS: Record<
  string,
  { alcoholic: Pairing[]; nonAlcoholic: Pairing[] }
> = {
  indian: {
    nonAlcoholic: [
      { drink: 'Masala Chaas (Spiced Buttermilk)', reason: 'Cools the palate after spicy food and aids digestion', type: 'non-alcoholic' },
      { drink: 'Rose Lassi', reason: 'Creamy sweetness balances strong spices', type: 'non-alcoholic' },
      { drink: 'Nimbu Pani (Limeade)', reason: 'Cuts through richness with citrus brightness', type: 'non-alcoholic' },
      { drink: 'Jaljeera', reason: 'Cumin-spiced water is a classic Indian digestif', type: 'non-alcoholic' },
    ],
    alcoholic: [
      { drink: 'Indian Pale Ale (IPA)', reason: 'Bitter hops balance bold Indian spices', type: 'alcoholic' },
      { drink: 'Mango Lassi Cocktail (with vodka)', reason: 'Fruit sweetness mellows heat', type: 'alcoholic' },
      { drink: 'Kingfisher Lager', reason: 'Light and refreshing — classic Indian beer pairing', type: 'alcoholic' },
    ],
  },
  italian: {
    nonAlcoholic: [
      { drink: 'San Pellegrino Limonata', reason: 'Italian sparkling lemon refreshes between bites', type: 'non-alcoholic' },
      { drink: 'Fresh basil lemonade', reason: 'Herbaceous notes echo the dish', type: 'non-alcoholic' },
    ],
    alcoholic: [
      { drink: 'Chianti Classico', reason: 'Tuscan red with earthy notes is the classic pasta companion', type: 'alcoholic' },
      { drink: 'Pinot Grigio', reason: 'Light white cuts through creamy pasta sauces', type: 'alcoholic' },
      { drink: 'Peroni lager', reason: 'Italian lager for a casual, refreshing pairing', type: 'alcoholic' },
    ],
  },
  mexican: {
    nonAlcoholic: [
      { drink: 'Horchata', reason: 'Creamy rice drink soothes heat from chillies', type: 'non-alcoholic' },
      { drink: 'Agua Fresca (watermelon or tamarind)', reason: 'Light sweetness contrasts bold flavours', type: 'non-alcoholic' },
    ],
    alcoholic: [
      { drink: 'Classic Margarita', reason: 'Lime and salt amplify the citrus notes in Mexican cuisine', type: 'alcoholic' },
      { drink: 'Mexican lager with lime (Corona style)', reason: 'Refreshing and light against rich tacos', type: 'alcoholic' },
    ],
  },
  chinese: {
    nonAlcoholic: [
      { drink: 'Jasmine green tea', reason: 'Floral tea cleanses the palate between flavourful bites', type: 'non-alcoholic' },
      { drink: 'Barley water', reason: 'Neutral and cooling, balances rich sauces', type: 'non-alcoholic' },
    ],
    alcoholic: [
      { drink: 'Tsingtao lager', reason: 'Classic Chinese beer, light enough not to overpower', type: 'alcoholic' },
      { drink: 'Plum wine (Umeshu)', reason: 'Sweet-tart profile echoes sweet sauces', type: 'alcoholic' },
    ],
  },
  mediterranean: {
    nonAlcoholic: [
      { drink: 'Mint lemonade', reason: 'Fresh and bright, echoes herb-heavy dishes', type: 'non-alcoholic' },
      { drink: 'Pomegranate juice', reason: 'Tart and antioxidant-rich, pairs with grilled dishes', type: 'non-alcoholic' },
    ],
    alcoholic: [
      { drink: 'Sauvignon Blanc', reason: 'Crisp acidity balances olive oil and lemon', type: 'alcoholic' },
      { drink: 'Rosé wine', reason: 'Versatile and food-friendly for mezze spreads', type: 'alcoholic' },
    ],
  },
};

// Generic pairings when cuisine isn't in the database
const GENERIC_NON_ALCOHOLIC: Pairing[] = [
  { drink: 'Sparkling water with lemon', reason: 'Neutral palate cleanser that works with anything', type: 'non-alcoholic' },
  { drink: 'Cold brew iced tea', reason: 'Light tannins complement most savoury dishes', type: 'non-alcoholic' },
  { drink: 'Fresh coconut water', reason: 'Hydrating with mild sweetness, great for spicy food', type: 'non-alcoholic' },
];

const GENERIC_ALCOHOLIC: Pairing[] = [
  { drink: 'Light lager', reason: 'Versatile and refreshing — rarely clashes with food', type: 'alcoholic' },
  { drink: 'Dry rosé wine', reason: 'Bridges white and red wine profiles, pairs with most dishes', type: 'alcoholic' },
];

function matchCuisine(cuisineType: string): string {
  const norm = cuisineType.toLowerCase();
  for (const key of Object.keys(CUISINE_PAIRINGS)) {
    if (norm.includes(key)) return key;
  }
  return '';
}

export const suggestDrinkPairing = tool({
  description:
    'Suggest drink pairings for a dish — both Indian (lassi, chaas, jaljeera) and international options. Call once the recipe is complete.',
  inputSchema: SuggestDrinkPairingParams,
  execute: async ({ cuisineType, isVegetarian: _isVegetarian, includeAlcohol }: z.infer<typeof SuggestDrinkPairingParams>) => {
    const cuisineKey = matchCuisine(cuisineType);
    const db = CUISINE_PAIRINGS[cuisineKey];

    const nonAlcoholic = db?.nonAlcoholic ?? GENERIC_NON_ALCOHOLIC;
    const alcoholic = includeAlcohol ? (db?.alcoholic ?? GENERIC_ALCOHOLIC) : [];

    // Always lead with non-alcoholic; append alcoholic if requested
    const pairings: Pairing[] = [...nonAlcoholic.slice(0, 2), ...alcoholic.slice(0, 1)];

    return { pairings };
  },
});
