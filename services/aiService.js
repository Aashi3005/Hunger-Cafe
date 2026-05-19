import { GROQ_API_KEY } from "@/config/apiConfig";

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const groqRequest = async (prompt, maxTokens = 2000, timeoutMs = 30000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err?.error?.message || `HTTP ${response.status}`;
      throw new Error(msg);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    clearTimeout(timer);
    throw error;
  }
};

export const generateRecipeWithAI = async (ingredients, cuisineType, dietaryNeeds, cookingTime, servings) => {
  const startTime = Date.now();
  console.log('🔥 Starting single recipe generation with Groq...');

  const prompt = `Create a recipe using these ingredients: ${ingredients}.
Preferences: ${cuisineType || 'any'} cuisine, ${dietaryNeeds || 'any'} diet, ${cookingTime || '30'} min, ${servings || '4'} servings.

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "recipeName": "string",
  "description": "brief description",
  "rating": 4.5,
  "totalTime": "${cookingTime || '30 min'}",
  "prepTime": "15 min",
  "servings": "${servings || '4'}",
  "calories": 350,
  "cuisine": "${cuisineType || 'International'}",
  "difficulty": "Easy",
  "tags": ["tag1", "tag2"],
  "ingredients": [{"name": "ingredient", "quantity": "1 cup", "essential": true}],
  "instructions": [{"step": 1, "description": "instruction", "time": "5 min"}],
  "nutrition": {"calories": 350, "protein": "15g", "carbs": "30g", "fat": "10g", "fiber": "5g", "sugar": "3g"},
  "tips": ["tip1", "tip2"]
}`;

  try {
    console.log(`📤 Sending request to Groq (${GROQ_MODEL})...`);
    const text = await groqRequest(prompt, 1500, 20000);

    const processingTime = Date.now() - startTime;
    console.log(`⚡ Groq responded in ${processingTime}ms`);

    let recipeData;
    try {
      recipeData = JSON.parse(text);
    } catch {
      throw new Error('Failed to parse Groq response as JSON');
    }

    if (!recipeData.recipeName || !recipeData.ingredients || !recipeData.instructions) {
      throw new Error('Invalid recipe structure from Groq');
    }

    recipeData.ratingCount = Math.floor(Math.random() * 500) + 100;
    recipeData.title = recipeData.recipeName;

    const imageResult = await generateRecipeImage(recipeData.recipeName, recipeData.cuisine);
    recipeData.imageUrl = imageResult.imageUrl;

    console.log(`✅ Recipe generated in ${Date.now() - startTime}ms:`, recipeData.recipeName);
    return { success: true, data: recipeData };
  } catch (error) {
    console.error(`❌ Groq error after ${Date.now() - startTime}ms:`, error.message);

    if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('rate')) {
      return {
        success: false,
        error: 'API quota exceeded. Please try again later.',
        fallback: generateFallbackRecipe(ingredients, cuisineType, dietaryNeeds, cookingTime, servings),
      };
    }

    return {
      success: false,
      error: error.message,
      fallback: generateFallbackRecipe(ingredients, cuisineType, dietaryNeeds, cookingTime, servings),
    };
  }
};

export const generateMultipleRecipesWithAI = async (ingredients, cuisineType, dietaryNeeds, cookingTime, servings) => {
  const startTime = Date.now();
  console.log('🔥 Starting multiple recipes generation with Groq...');

  const prompt = `Create 3 distinct recipes using these ingredients: ${ingredients}.
Style: ${cuisineType || 'varied'} cuisines, Diet: ${dietaryNeeds || 'any'}, Time: ~${cookingTime || '30'} min each.

Return ONLY a valid JSON object with a "recipes" array (no markdown, no extra text):
{
  "recipes": [
    {
      "recipeName": "Recipe Name",
      "description": "brief description",
      "rating": 4.3,
      "totalTime": "30 min",
      "prepTime": "10 min",
      "servings": "${servings || '4'}",
      "calories": 300,
      "cuisine": "Cuisine Type",
      "difficulty": "Easy",
      "tags": ["tag1", "tag2"],
      "ingredients": [{"name": "ingredient", "quantity": "1 cup", "essential": true}],
      "instructions": [{"step": 1, "description": "instruction", "time": "5 min"}],
      "nutrition": {"calories": 300, "protein": "15g", "carbs": "30g", "fat": "8g", "fiber": "4g", "sugar": "3g"},
      "tips": ["tip1"]
    }
  ]
}`;

  try {
    console.log(`📤 Sending multiple recipes request to Groq (${GROQ_MODEL})...`);
    const text = await groqRequest(prompt, 3000, 40000);

    const processingTime = Date.now() - startTime;
    console.log(`⚡ Groq responded in ${processingTime}ms`);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('Failed to parse Groq response as JSON');
    }

    let recipesData = Array.isArray(parsed) ? parsed : parsed.recipes;
    if (!Array.isArray(recipesData) || recipesData.length === 0) {
      throw new Error('Invalid recipes structure from Groq');
    }

    recipesData = recipesData.map((recipe, index) => ({
      ...recipe,
      id: `recipe_${Date.now()}_${index}`,
      ratingCount: Math.floor(Math.random() * 500) + 100,
      title: recipe.recipeName,
    }));

    console.log('🖼️ Generating AI images for recipes...');
    const recipesWithImages = await Promise.all(
      recipesData.map(async (recipe) => {
        const imageResult = await generateRecipeImage(recipe.recipeName, recipe.cuisine);
        return { ...recipe, imageUrl: imageResult.imageUrl };
      })
    );

    console.log(`✅ ${recipesWithImages.length} recipes generated in ${Date.now() - startTime}ms`);
    return { success: true, data: recipesWithImages };
  } catch (error) {
    console.error(`❌ Groq error after ${Date.now() - startTime}ms:`, error.message);

    if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('rate')) {
      console.log('🔄 Quota exceeded, using fallback recipes');
      return {
        success: false,
        error: 'API quota exceeded. Please try again later.',
        fallback: generateFallbackRecipes(ingredients, cuisineType, dietaryNeeds, cookingTime, servings),
      };
    }

    console.log('🔄 Groq failed, using fallback recipes');
    return {
      success: false,
      error: error.message,
      fallback: generateFallbackRecipes(ingredients, cuisineType, dietaryNeeds, cookingTime, servings),
    };
  }
};

export const generateRecipeImage = async (recipeName, cuisine = '') => {
  try {
    console.log(`🖼️ Generating image for recipe: ${recipeName}`);
    let prompt = `professional food photography of ${recipeName}`;
    if (cuisine) prompt += `, ${cuisine} cuisine style`;
    prompt += `, appetizing, high quality, restaurant style, beautiful plating, warm lighting`;

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=400&height=400&seed=${Date.now()}`;
    console.log(`✅ Generated image URL: ${imageUrl}`);
    return { success: true, imageUrl, prompt };
  } catch (error) {
    console.error('❌ Error generating recipe image:', error);
    return { success: false, error: error.message, imageUrl: 'https://via.placeholder.com/400x400/ED5565/FFFFFF?text=🍽️' };
  }
};

const generateFallbackRecipe = (ingredients, cuisineType, dietaryNeeds, cookingTime, servings) => {
  const ingredientList = ingredients.split(',').map(i => i.trim()).filter(Boolean);
  const recipe = {
    recipeName: `Delicious ${ingredientList[0] || 'Home'} Recipe`,
    title: `Delicious ${ingredientList[0] || 'Home'} Recipe`,
    description: `A wonderful homemade recipe featuring ${ingredientList.join(', ')}`,
    rating: '4.3',
    ratingCount: 234,
    totalTime: cookingTime || '45 min',
    prepTime: '15 min',
    servings: servings || '4',
    calories: 350,
    cuisine: cuisineType || 'International',
    difficulty: 'Medium',
    tags: [cuisineType || 'Homemade', dietaryNeeds || 'Comfort Food'].filter(Boolean),
    ingredients: ingredientList.map(i => ({ name: i.charAt(0).toUpperCase() + i.slice(1), quantity: '1 cup', essential: true })),
    instructions: [
      { step: 1, description: 'Prepare all ingredients by washing, chopping, and measuring.', time: '10 min' },
      { step: 2, description: 'Heat oil in a large pan over medium heat and begin cooking.', time: '15 min' },
      { step: 3, description: 'Season well and combine all ingredients until properly cooked.', time: '10 min' },
      { step: 4, description: 'Serve immediately while hot and enjoy!', time: '2 min' },
    ],
    nutrition: { calories: 350, protein: '18g', carbs: '42g', fat: '12g', fiber: '5g', sugar: '6g' },
    tips: ['Use fresh ingredients', "Don't overcook", 'Season at each step', 'Serve immediately'],
  };
  const imageResult = generateRecipeImage(recipe.recipeName, recipe.cuisine);
  recipe.imageUrl = imageResult.imageUrl;
  return recipe;
};

const generateFallbackRecipes = (ingredients, cuisineType, dietaryNeeds, cookingTime, servings) => {
  const ingredientList = ingredients.split(',').map(i => i.trim()).filter(Boolean);
  const main = ingredientList[0] || 'ingredients';

  const recipes = [
    {
      id: `fallback_${Date.now()}_1`,
      recipeName: `Classic ${main} Stir Fry`,
      title: `Classic ${main} Stir Fry`,
      description: `A quick and delicious stir fry featuring ${main}`,
      rating: 4.3, ratingCount: 234,
      totalTime: cookingTime || '25 min', prepTime: '10 min',
      servings: servings || '4', calories: 320,
      cuisine: cuisineType || 'Asian', difficulty: 'Easy',
      tags: ['Quick', 'Healthy', cuisineType || 'Asian'].filter(Boolean),
      ingredients: ingredientList.slice(0, 5).map(i => ({ name: i.charAt(0).toUpperCase() + i.slice(1), quantity: '1 cup', essential: true })),
      instructions: [
        { step: 1, description: 'Prep all ingredients by washing and chopping', time: '8 min' },
        { step: 2, description: 'Heat oil in a wok over medium-high heat', time: '2 min' },
        { step: 3, description: 'Add ingredients and stir fry until cooked', time: '12 min' },
        { step: 4, description: 'Season and serve immediately', time: '3 min' },
      ],
      nutrition: { calories: 320, protein: '15g', carbs: '35g', fat: '8g', fiber: '4g', sugar: '5g' },
      tips: ['Use high heat for best results', "Don't overcook vegetables"],
    },
    {
      id: `fallback_${Date.now()}_2`,
      recipeName: `Hearty ${main} Soup`,
      title: `Hearty ${main} Soup`,
      description: `Comforting soup made with fresh ${main}`,
      rating: 4.5, ratingCount: 189,
      totalTime: cookingTime || '40 min', prepTime: '15 min',
      servings: servings || '6', calories: 280,
      cuisine: cuisineType || 'Comfort Food', difficulty: 'Medium',
      tags: ['Comfort Food', 'Healthy', 'Soup'],
      ingredients: ingredientList.slice(0, 6).map(i => ({ name: i.charAt(0).toUpperCase() + i.slice(1), quantity: '2 cups', essential: true })),
      instructions: [
        { step: 1, description: 'Prepare and chop all ingredients', time: '10 min' },
        { step: 2, description: 'Sauté aromatics in a large pot', time: '5 min' },
        { step: 3, description: 'Add remaining ingredients and simmer', time: '20 min' },
        { step: 4, description: 'Season to taste and serve hot', time: '5 min' },
      ],
      nutrition: { calories: 280, protein: '12g', carbs: '40g', fat: '6g', fiber: '8g', sugar: '4g' },
      tips: ['Let it simmer for rich flavor', 'Add herbs at the end'],
    },
    {
      id: `fallback_${Date.now()}_3`,
      recipeName: `Grilled ${main} Delight`,
      title: `Grilled ${main} Delight`,
      description: `Perfectly grilled ${main} with amazing flavors`,
      rating: 4.4, ratingCount: 267,
      totalTime: cookingTime || '30 min', prepTime: '10 min',
      servings: servings || '4', calories: 350,
      cuisine: cuisineType || 'BBQ', difficulty: 'Easy',
      tags: ['Grilled', 'BBQ', 'Healthy'],
      ingredients: ingredientList.slice(0, 4).map(i => ({ name: i.charAt(0).toUpperCase() + i.slice(1), quantity: '1 lb', essential: true })),
      instructions: [
        { step: 1, description: 'Marinate ingredients for better flavor', time: '5 min' },
        { step: 2, description: 'Preheat grill to medium-high heat', time: '5 min' },
        { step: 3, description: 'Grill until perfectly cooked', time: '15 min' },
        { step: 4, description: 'Rest and serve with sides', time: '5 min' },
      ],
      nutrition: { calories: 350, protein: '25g', carbs: '15g', fat: '12g', fiber: '3g', sugar: '2g' },
      tips: ["Don't flip too early", 'Let meat rest before serving'],
    },
  ];

  console.log('🖼️ Generating AI images for fallback recipes...');
  return recipes.map(recipe => {
    const imageResult = generateRecipeImage(recipe.recipeName, recipe.cuisine);
    return { ...recipe, imageUrl: imageResult.imageUrl };
  });
};

export const resetQuotaCounter = () => {
  console.log('🔄 Quota counter reset (Groq has generous limits)');
};

export const getQuotaStatus = () => ({
  requestCount: 0,
  maxRequests: 14400,
  quotaExceeded: false,
  provider: 'Groq',
});

export const debugAIService = async () => {
  console.log('🔍 Debug: Using Groq —', GROQ_MODEL);
  const hasKey = !!GROQ_API_KEY && GROQ_API_KEY.length > 10;
  return {
    apiKeyStatus: hasKey ? 'Present' : 'Missing',
    provider: 'Groq',
    model: GROQ_MODEL,
    recommendations: hasKey ? [] : ['Add GROQ_API_KEY to config/apiConfig.js'],
  };
};

export const quickHealthCheck = async () => {
  console.log('⚡ Quick Groq health check...');
  try {
    const startTime = Date.now();
    await groqRequest('{"status": "healthy"}', 50, 8000);
    return { healthy: true, responseTime: Date.now() - startTime, model: GROQ_MODEL };
  } catch (error) {
    return { healthy: false, error: error.message, model: GROQ_MODEL };
  }
};

export default {
  generateRecipeWithAI,
  generateMultipleRecipesWithAI,
  generateRecipeImage,
  debugAIService,
  quickHealthCheck,
  resetQuotaCounter,
  getQuotaStatus,
};
