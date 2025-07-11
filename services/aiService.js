import { GEMINI_API_KEY } from "@/config/apiConfig";
import { GoogleGenerativeAI } from "@google/generative-ai";

// initialize krre h Gemini AI Client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Rate limiting and quota management
let lastRequestTime = 0;
let requestCount = 0;
const RATE_LIMIT_DELAY = 5000; // 5 seconds between requests
const MAX_REQUESTS_PER_MINUTE = 10; // Conservative limit

// Helper function to wait for rate limit
const waitForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    const waitTime = RATE_LIMIT_DELAY - timeSinceLastRequest;
    console.log(`⏳ Rate limiting: waiting ${waitTime}ms before next request`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
  requestCount++;
  
  if (requestCount > MAX_REQUESTS_PER_MINUTE) {
    console.log('⚠️ Too many requests, using fallback');
    throw new Error('Rate limit exceeded, using fallback');
  }
};

// Helper function to create a timeout promise
const createTimeoutPromise = (timeoutMs) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs);
  });
};

// Enhanced AI request with quota handling
const makeAIRequestWithQuotaHandling = async (model, prompt, timeoutMs = 30000) => {
  try {
    await waitForRateLimit();
    
    const aiPromise = model.generateContent(prompt);
    const timeoutPromise = createTimeoutPromise(timeoutMs);
    
    return Promise.race([aiPromise, timeoutPromise]);
  } catch (error) {
    if (error.message.includes('quota') || error.message.includes('429')) {
      console.log('🚫 Quota exceeded, switching to fallback immediately');
      throw new Error('Quota exceeded');
    }
    throw error;
  }
};

export const generateRecipeWithAI = async (ingredients, cuisineType, dietaryNeeds, cookingTime, servings) => {
  const startTime = Date.now();
  console.log('🔥 Starting single recipe generation...');
  
  // Check if we should use fallback due to recent quota issues
  if (requestCount > 8) {
    console.log('🔄 Using fallback due to high request count');
    const fallbackRecipe = generateFallbackRecipe(ingredients, cuisineType, dietaryNeeds, cookingTime, servings);
    return { success: false, fallback: fallbackRecipe, error: 'Rate limit prevention' };
  }
  
  // Only try gemini-1.5-flash for single recipes to save quota
  const modelNames = ['gemini-1.5-flash'];
  
  for(const modelName of modelNames) {
    try {
      console.log(`⏳ Trying Model: ${modelName} at ${new Date().toLocaleTimeString()}`);

      const model = genAI.getGenerativeModel({model: modelName});

      // Shorter, more efficient prompt to save tokens
      const prompt = `Create a JSON recipe for: ${ingredients}. 
      
      Preferences: ${cuisineType || 'any'} cuisine, ${dietaryNeeds || 'any'} diet, ${cookingTime || '30'} min, ${servings || '4'} servings.
      
      JSON format only:
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

      console.log(`📤 Sending request to ${modelName}...`);
      const result = await makeAIRequestWithQuotaHandling(model, prompt, 20000);
      const response = await result.response;
      const text = response.text();
      
      const processingTime = Date.now() - startTime;
      console.log(`⚡ Response received from ${modelName} in ${processingTime}ms`);

      let recipeData;
      try {
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        recipeData = JSON.parse(cleanText);
      } catch (parseError) {
        console.error("❌ Error parsing AI response:", parseError);
        throw new Error('Failed to parse AI response');
      }

      if (!recipeData.recipeName || !recipeData.ingredients || !recipeData.instructions) {
        throw new Error('Invalid recipe data structure from AI');
      }

      recipeData.ratingCount = Math.floor(Math.random() * 500) + 100;
      recipeData.title = recipeData.recipeName;

      // Generate AI image for the recipe
      console.log('🖼️ Generating AI image for recipe...');
      const imageResult = await generateRecipeImage(recipeData.recipeName, recipeData.cuisine);
      recipeData.imageUrl = imageResult.imageUrl;

      const totalTime = Date.now() - startTime;
      console.log(`✅ AI recipe generated successfully with ${modelName} in ${totalTime}ms:`, recipeData.recipeName);
      return { success: true, data: recipeData };
    } catch (error) {
      const errorTime = Date.now() - startTime;
      console.error(`❌ Error with model ${modelName} after ${errorTime}ms:`, error.message);

      if (error.message.includes('quota') || error.message.includes('429')) {
        console.log('🔄 Quota exceeded, returning fallback recipe immediately');
        return {
          success: false,
          error: 'API quota exceeded. Please try again later.',
          fallback: generateFallbackRecipe(ingredients, cuisineType, dietaryNeeds, cookingTime, servings)
        };
      }

      if (modelName === modelNames[modelNames.length - 1]) {
        console.log('🔄 All models failed, returning fallback recipe');
        return {
          success: false,
          error: `All AI models failed. Last error: ${error.message}`,
          fallback: generateFallbackRecipe(ingredients, cuisineType, dietaryNeeds, cookingTime, servings)
        };
      }
      continue;
    }
  }
};

// Helper function to generate AI image for recipe
export const generateRecipeImage = async (recipeName, cuisine = '') => {
  try {
    console.log(`🖼️ Generating image for recipe: ${recipeName}`);
    
    // Create a detailed prompt for better food images
    let prompt = `professional food photography of ${recipeName}`;
    if (cuisine) {
      prompt += `, ${cuisine} cuisine style`;
    }
    prompt += `, appetizing, high quality, restaurant style, beautiful plating, warm lighting`;
    
    // Use Pollinations.ai free API - no API key required
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=400&height=400&seed=${Date.now()}`;
    
    console.log(`✅ Generated image URL: ${imageUrl}`);
    return {
      success: true,
      imageUrl: imageUrl,
      prompt: prompt
    };
  } catch (error) {
    console.error('❌ Error generating recipe image:', error);
    return {
      success: false,
      error: error.message,
      // Fallback to a food placeholder image
      imageUrl: 'https://via.placeholder.com/400x400/ED5565/FFFFFF?text=🍽️'
    };
  }
};

// Enhanced fallback recipe with image
const generateFallbackRecipe = (ingredients, cuisineType, dietaryNeeds, cookingTime, servings) => {
  const ingredientList = ingredients.split(',').map(item => item.trim()).filter(item => item);
  
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
    ingredients: ingredientList.map(ingredient => ({
      name: ingredient.charAt(0).toUpperCase() + ingredient.slice(1),
      quantity: '1 cup',
      essential: true
    })),
    instructions: [
      {
        step: 1,
        description: "Prepare all ingredients by washing, chopping, and measuring them according to requirements.",
        time: "10 min"
      },
      {
        step: 2,
        description: "Heat oil in a large pan over medium heat and begin cooking the main ingredients.",
        time: "15 min"
      },
      {
        step: 3,
        description: "Season well and combine all ingredients until properly cooked.",
        time: "10 min"
      },
      {
        step: 4,
        description: "Serve immediately while hot and enjoy your homemade meal!",
        time: "2 min"
      }
    ],
    nutrition: {
      calories: 350,
      protein: '18g',
      carbs: '42g',
      fat: '12g',
      fiber: '5g',
      sugar: '6g'
    },
    tips: [
      "Use fresh ingredients for the best flavor",
      "Don't overcook the main ingredients",
      "Season to taste at each step",
      "Serve immediately for best results"
    ]
  };

  // Generate image for fallback recipe
  const imageResult = generateRecipeImage(recipe.recipeName, recipe.cuisine);
  recipe.imageUrl = imageResult.imageUrl;

  return recipe;
};

// Generate multiple recipe suggestions (with quota awareness)
export const generateMultipleRecipesWithAI = async (ingredients, cuisineType, dietaryNeeds, cookingTime, servings) => {
  const startTime = Date.now();
  console.log('🔥 Starting multiple recipes generation...');
  
  // If quota issues, immediately use fallback
  if (requestCount > 5) {
    console.log('🔄 Using fallback recipes due to quota concerns');
    return {
      success: false,
      error: 'Using fallback to prevent quota issues',
      fallback: generateFallbackRecipes(ingredients, cuisineType, dietaryNeeds, cookingTime, servings)
    };
  }
  
  // Only try one model for multiple recipes to save quota
  const modelNames = ['gemini-1.5-flash'];
  
  for(const modelName of modelNames) {
    try {
      console.log(`⏳ Trying Model: ${modelName} for multiple recipes at ${new Date().toLocaleTimeString()}`);

      const model = genAI.getGenerativeModel({model: modelName});

      // More efficient prompt for multiple recipes
      const prompt = `Create 3 JSON recipes using: ${ingredients}
      
      Style: ${cuisineType || 'varied'}, Diet: ${dietaryNeeds || 'any'}, Time: ${cookingTime || '30'} min
      
      JSON array format only:
      [
        {
          "recipeName": "Recipe 1",
          "description": "brief description",
          "rating": 4.3,
          "totalTime": "${cookingTime || '30 min'}",
          "prepTime": "15 min",
          "servings": "${servings || '4'}",
          "calories": 300,
          "cuisine": "${cuisineType || 'International'}",
          "difficulty": "Easy",
          "tags": ["tag1"],
          "ingredients": [{"name": "ingredient", "quantity": "1 cup", "essential": true}],
          "instructions": [{"step": 1, "description": "instruction", "time": "5 min"}],
          "nutrition": {"calories": 300, "protein": "15g", "carbs": "30g", "fat": "8g", "fiber": "4g", "sugar": "3g"},
          "tips": ["tip1"]
        }
      ]`;

      console.log(`📤 Sending multiple recipes request to ${modelName}...`);
      const result = await makeAIRequestWithQuotaHandling(model, prompt, 40000);
      const response = await result.response;
      const text = response.text();
      
      const processingTime = Date.now() - startTime;
      console.log(`⚡ Multiple recipes response received from ${modelName} in ${processingTime}ms`);

      let recipesData;
      try {
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        recipesData = JSON.parse(cleanText);
      } catch (parseError) {
        console.error("❌ Error parsing AI response for multiple recipes:", parseError);
        throw new Error('Failed to parse AI response for multiple recipes');
      }

      if (!Array.isArray(recipesData) || recipesData.length === 0) {
        throw new Error('Invalid recipes data structure from AI');
      }

      // Add additional computed fields to each recipe
      recipesData = recipesData.map((recipe, index) => ({
        ...recipe,
        id: `recipe_${Date.now()}_${index}`,
        ratingCount: Math.floor(Math.random() * 500) + 100,
        title: recipe.recipeName
      }));

      // Generate AI images for all recipes
      console.log('🖼️ Generating AI images for all recipes...');
      const recipesWithImages = await Promise.all(
        recipesData.map(async (recipe, index) => {
          const imageResult = await generateRecipeImage(recipe.recipeName, recipe.cuisine);
          return {
            ...recipe,
            imageUrl: imageResult.imageUrl
          };
        })
      );

      const totalTime = Date.now() - startTime;
      console.log(`✅ AI generated ${recipesWithImages.length} recipes with images successfully with model ${modelName} in ${totalTime}ms`);
      return { success: true, data: recipesWithImages };
    } catch (error) {
      const errorTime = Date.now() - startTime;
      console.error(`❌ Error with model ${modelName} after ${errorTime}ms:`, error.message);

      // Handle quota errors immediately
      if (error.message.includes('quota') || error.message.includes('429')) {
        console.log('🔄 Quota exceeded for multiple recipes, using fallback');
        return {
          success: false,
          error: 'API quota exceeded. Please try again later.',
          fallback: generateFallbackRecipes(ingredients, cuisineType, dietaryNeeds, cookingTime, servings)
        };
      }

      // If this is the last model, try single recipe generation as fallback
      if (modelName === modelNames[modelNames.length - 1]) {
        console.log('🔄 Multiple recipes failed, trying single recipe generation...');
        
        try {
          const singleRecipeResult = await generateRecipeWithAI(ingredients, cuisineType, dietaryNeeds, cookingTime, servings);
          if (singleRecipeResult.success) {
            console.log('✅ Single recipe generation succeeded as fallback');
            return { 
              success: true, 
              data: [singleRecipeResult.data], // Wrap single recipe in array
              fallbackUsed: 'single-recipe'
            };
          }
        } catch (singleError) {
          console.error('❌ Single recipe fallback also failed:', singleError.message);
        }
        
        console.log('🔄 Using hardcoded fallback recipes');
        return {
          success: false,
          error: `All AI models failed. Last error: ${error.message}`,
          fallback: generateFallbackRecipes(ingredients, cuisineType, dietaryNeeds, cookingTime, servings)
        };
      }
      continue;
    }
  }
};

// Generate fallback recipes when AI fails
const generateFallbackRecipes = (ingredients, cuisineType, dietaryNeeds, cookingTime, servings) => {
  const ingredientList = ingredients.split(',').map(item => item.trim()).filter(item => item);
  const mainIngredient = ingredientList[0] || 'ingredients';
  
  const recipes = [
    {
      id: `fallback_${Date.now()}_1`,
      recipeName: `Classic ${mainIngredient} Stir Fry`,
      title: `Classic ${mainIngredient} Stir Fry`,
      description: `A quick and delicious stir fry featuring ${mainIngredient}`,
      rating: 4.3,
      ratingCount: 234,
      totalTime: cookingTime || '25 min',
      prepTime: '10 min',
      servings: servings || '4',
      calories: 320,
      cuisine: cuisineType || 'Asian',
      difficulty: 'Easy',
      tags: ['Quick', 'Healthy', cuisineType || 'Asian'].filter(Boolean),
      ingredients: ingredientList.slice(0, 5).map(ingredient => ({
        name: ingredient.charAt(0).toUpperCase() + ingredient.slice(1),
        quantity: '1 cup',
        essential: true
      })),
      instructions: [
        { step: 1, description: "Prep all ingredients by washing and chopping", time: "8 min" },
        { step: 2, description: "Heat oil in a large pan or wok over medium-high heat", time: "2 min" },
        { step: 3, description: "Add ingredients and stir fry until cooked", time: "12 min" },
        { step: 4, description: "Season and serve immediately", time: "3 min" }
      ],
      nutrition: { calories: 320, protein: '15g', carbs: '35g', fat: '8g', fiber: '4g', sugar: '5g' },
      tips: ["Use high heat for best results", "Don't overcook the vegetables"]
    },
    {
      id: `fallback_${Date.now()}_2`,
      recipeName: `Hearty ${mainIngredient} Soup`,
      title: `Hearty ${mainIngredient} Soup`,
      description: `Comforting soup made with fresh ${mainIngredient}`,
      rating: 4.5,
      ratingCount: 189,
      totalTime: cookingTime || '40 min',
      prepTime: '15 min',
      servings: servings || '6',
      calories: 280,
      cuisine: cuisineType || 'Comfort Food',
      difficulty: 'Medium',
      tags: ['Comfort Food', 'Healthy', 'Soup'].filter(Boolean),
      ingredients: ingredientList.slice(0, 6).map(ingredient => ({
        name: ingredient.charAt(0).toUpperCase() + ingredient.slice(1),
        quantity: '2 cups',
        essential: true
      })),
      instructions: [
        { step: 1, description: "Prepare and chop all ingredients", time: "10 min" },
        { step: 2, description: "Sauté aromatics in a large pot", time: "5 min" },
        { step: 3, description: "Add remaining ingredients and simmer", time: "20 min" },
        { step: 4, description: "Season to taste and serve hot", time: "5 min" }
      ],
      nutrition: { calories: 280, protein: '12g', carbs: '40g', fat: '6g', fiber: '8g', sugar: '4g' },
      tips: ["Let it simmer for rich flavor", "Add herbs at the end"]
    },
    {
      id: `fallback_${Date.now()}_3`,
      recipeName: `Grilled ${mainIngredient} Delight`,
      title: `Grilled ${mainIngredient} Delight`,
      description: `Perfectly grilled ${mainIngredient} with amazing flavors`,
      rating: 4.4,
      ratingCount: 267,
      totalTime: cookingTime || '30 min',
      prepTime: '10 min',
      servings: servings || '4',
      calories: 350,
      cuisine: cuisineType || 'BBQ',
      difficulty: 'Easy',
      tags: ['Grilled', 'BBQ', 'Healthy'].filter(Boolean),
      ingredients: ingredientList.slice(0, 4).map(ingredient => ({
        name: ingredient.charAt(0).toUpperCase() + ingredient.slice(1),
        quantity: '1 lb',
        essential: true
      })),
      instructions: [
        { step: 1, description: "Marinate ingredients for better flavor", time: "5 min" },
        { step: 2, description: "Preheat grill to medium-high heat", time: "5 min" },
        { step: 3, description: "Grill ingredients until perfectly cooked", time: "15 min" },
        { step: 4, description: "Rest and serve with sides", time: "5 min" }
      ],
      nutrition: { calories: 350, protein: '25g', carbs: '15g', fat: '12g', fiber: '3g', sugar: '2g' },
      tips: ["Don't flip too early", "Let meat rest before serving"]
    }
  ];

  // Generate images for fallback recipes
  console.log('🖼️ Generating AI images for fallback recipes...');
  
  // Add images to each recipe
  const recipesWithImages = recipes.map(recipe => {
    const imageResult = generateRecipeImage(recipe.recipeName, recipe.cuisine);
    return {
      ...recipe,
      imageUrl: imageResult.imageUrl
    };
  });

  return recipesWithImages;
};

// Reset quota counter (call this hourly or daily)
export const resetQuotaCounter = () => {
  requestCount = 0;
  lastRequestTime = 0;
};

// Get current quota status
export const getQuotaStatus = () => {
  return {
    requestCount,
    maxRequests: MAX_REQUESTS_PER_MINUTE,
    lastRequestTime,
    timeUntilNextRequest: Math.max(0, RATE_LIMIT_DELAY - (Date.now() - lastRequestTime)),
    quotaExceeded: requestCount > MAX_REQUESTS_PER_MINUTE
  };
};

// Debug function to check API and network status
export const debugAIService = async () => {
  console.log('🔍 Starting AI Service Debug...');
  
  const quotaStatus = getQuotaStatus();
  
  const debugInfo = {
    apiKeyStatus: 'Unknown',
    networkStatus: 'Unknown',
    quotaStatus: quotaStatus,
    modelAvailability: {},
    timestamp: new Date().toISOString(),
    recommendations: []
  };

  // Check API Key
  try {
    if (!GEMINI_API_KEY) {
      debugInfo.apiKeyStatus = 'Missing';
      debugInfo.recommendations.push('Add your Gemini API key to config/apiConfig.js');
      console.log('❌ API Key is missing');
    } else if (GEMINI_API_KEY.length < 10) {
      debugInfo.apiKeyStatus = 'Invalid';
      debugInfo.recommendations.push('Check your API key format');
      console.log('❌ API Key seems invalid (too short)');
    } else {
      debugInfo.apiKeyStatus = 'Present';
      console.log('✅ API Key is present');
    }
  } catch (error) {
    debugInfo.apiKeyStatus = 'Error';
    console.log('❌ Error checking API key:', error.message);
  }

  // Check Network
  try {
    const response = await fetch('https://www.google.com', { 
      method: 'HEAD'
    });
    if (response.ok) {
      debugInfo.networkStatus = 'Connected';
      console.log('✅ Network is connected');
    } else {
      debugInfo.networkStatus = 'Poor Connection';
      console.log('⚠️ Network connection is poor');
    }
  } catch (error) {
    debugInfo.networkStatus = 'Disconnected';
    debugInfo.recommendations.push('Check your internet connection');
    console.log('❌ Network is disconnected:', error.message);
  }

  // Add quota recommendations
  if (quotaStatus.quotaExceeded) {
    debugInfo.recommendations.push('Quota exceeded - wait 1 hour or use fallback recipes');
  } else if (quotaStatus.requestCount > 5) {
    debugInfo.recommendations.push('Approaching quota limit - consider using fallback recipes');
  }

  // Test only gemini-1.5-flash to avoid quota issues
  const testModels = ['gemini-1.5-flash'];
  
  for (const modelName of testModels) {
    if (quotaStatus.quotaExceeded) {
      debugInfo.modelAvailability[modelName] = {
        status: 'Skipped - Quota Exceeded',
        responseTime: null
      };
      console.log(`⚠️ Skipping ${modelName} test due to quota concerns`);
      continue;
    }

    try {
      console.log(`🧪 Testing model: ${modelName}`);
      const model = genAI.getGenerativeModel({model: modelName});
      
      const startTime = Date.now();
      const result = await makeAIRequestWithQuotaHandling(
        model, 
        'Generate a simple JSON object with just {"test": "success"}. No additional text.',
        10000 // 10 second timeout for test
      );
      const endTime = Date.now();
      
      const response = await result.response;
      const text = response.text();
      
      debugInfo.modelAvailability[modelName] = {
        status: 'Working',
        responseTime: endTime - startTime,
        responseLength: text.length
      };
      
      console.log(`✅ Model ${modelName} is working (${endTime - startTime}ms)`);
    } catch (error) {
      debugInfo.modelAvailability[modelName] = {
        status: 'Failed',
        error: error.message,
        responseTime: null
      };

      if (error.message.includes('quota') || error.message.includes('429')) {
        debugInfo.recommendations.push('Wait 1 hour for quota reset or upgrade to paid plan');
      }
      
      console.log(`❌ Model ${modelName} failed:`, error.message);
    }
  }

  console.log('🔍 Debug completed. Full report:', debugInfo);
  return debugInfo;
};

// Quick health check function
export const quickHealthCheck = async () => {
  console.log('⚡ Quick health check...');
  
  try {
    const model = genAI.getGenerativeModel({model: 'gemini-1.5-flash'});
    const startTime = Date.now();
    
    const result = await makeAIRequestWithQuotaHandling(
      model,
      'Respond with just: {"status": "healthy"}',
      8000 // 8 second timeout
    );
    
    const endTime = Date.now();
    const response = await result.response;
    const text = response.text();
    
    console.log(`✅ Health check passed in ${endTime - startTime}ms`);
    return { 
      healthy: true, 
      responseTime: endTime - startTime,
      model: 'gemini-1.5-flash'
    };
  } catch (error) {
    console.log(`❌ Health check failed:`, error.message);
    return { 
      healthy: false, 
      error: error.message,
      model: 'gemini-1.5-flash'
    };
  }
};

export default {
  generateRecipeWithAI,
  generateMultipleRecipesWithAI,
  generateRecipeImage,
  debugAIService,
  quickHealthCheck,
  resetQuotaCounter,
  getQuotaStatus
}; 
