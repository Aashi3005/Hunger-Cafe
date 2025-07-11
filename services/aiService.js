import { GEMINI_API_KEY } from "@/config/apiConfig";
import { GoogleGenerativeAI } from "@google/generative-ai";

// initialize krre h Gemini AI Client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Helper function to create a timeout promise
const createTimeoutPromise = (timeoutMs) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs);
  });
};

// Helper function to make AI request with timeout
const makeAIRequestWithTimeout = async (model, prompt, timeoutMs = 30000) => {
  const aiPromise = model.generateContent(prompt);
  const timeoutPromise = createTimeoutPromise(timeoutMs);
  
  return Promise.race([aiPromise, timeoutPromise]);
};

export const generateRecipeWithAI = async (ingredients, cuisineType, dietaryNeeds, cookingTime, servings) =>{
  const startTime = Date.now();
  console.log('🔥 Starting single recipe generation...');
  
  // different model names when one is not available
  const modelNames = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
  for(const modelName of modelNames) {
     try {
       console.log(`⏳ Trying Model: ${modelName} at ${new Date().toLocaleTimeString()}`);

       // get the generative model which we are using
       const model = genAI.getGenerativeModel({model: modelName});

       // generating the construct prompt 
       const prompt = `You are a world-class chef and recipe expert. A user has the following ingredients : ${ingredients}.
       
       Additional preferences:
       - Cuisine Type : ${cuisineType || 'any'}
       - Dietary Needs : ${dietaryNeeds || 'any'}
       - Cooking Time : ${cookingTime || 'any'}
       - Servings : ${servings || 'any'}
       
       Generate 1 detailed recipe that includes the ingredients. The recipe should be creative, practical and delicious.
       Respond with ONLY a valid JSON object. The schema must be exactly:
       {
         "recipeName": "string",
         "description": "string (brief description of the dish)",
         "rating": "number (4.0-5.0)",
         "totalTime": "string (eg. '30 minutes')",
         "prepTime": "string (eg. '10 minutes')",
         "servings": "string (number of servings)",
         "calories": "number (estimated calories per serving)",
         "cuisine": "string (cuisine type)",
         "difficulty": "string (Easy/Medium/Hard)",
         "tags": ["string array of relevant tags"],
         "ingredients": [
           {
             "name": "string (ingredient name)",
             "quantity": "string (amount needed)",
             "essential": "boolean (true if from user's list)"
           }
         ],
         "instructions": [
           {
             "step": "number",
             "description": "string (detailed instruction)",
             "time": "string (time for this step)"
           }
         ],
         "nutrition": {
           "calories": "number",
           "protein": "string (with unit)",
           "carbs": "string (with unit)",
           "fat": "string (with unit)",
           "fiber": "string (with unit)",
           "sugar": "string (with unit)"
         },
         "tips": [
           "string (helpful cooking tips)"
         ]
       }

       Make sure the response is valid JSON only, no additional text or formatting.`;

   //Generating the prompt response with timeout
   console.log(`📤 Sending request to ${modelName}...`);
   const result = await makeAIRequestWithTimeout(model, prompt, 20000); // 20 second timeout
   const response = await result.response;
   const text = response.text();
   
   const processingTime = Date.now() - startTime;
   console.log(`⚡ Response received from ${modelName} in ${processingTime}ms`);

   //Parse the JSON response
   let recipeData;
   try{
     //clean the response text with extra trim or any markdown formatting
     const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
     recipeData = JSON.parse(cleanText);
   } catch (parseError){
     console.error("❌ Error parsing AI response:", parseError);
     console.log('Raw AI response:', text);
     throw new Error('Failed to parse AI response');
   }
   //Validate the response structure
   if(!recipeData.recipeName || !recipeData.ingredients || !recipeData.instructions){
     throw new Error ('Invalid recipe data structure from AI');
   }
   // Additional computed fields
   recipeData.ratingCount = Math.floor(Math.random() * 500)+ 100;
   recipeData.title = recipeData.recipeName;

   const totalTime = Date.now() - startTime;
   console.log(`✅ AI recipe generated successfully with ${modelName} in ${totalTime}ms:`, recipeData.recipeName );
   return {success: true, data: recipeData};
     }catch (error) {
       const errorTime = Date.now() - startTime;
       console.error(`❌ Error with model ${modelName} after ${errorTime}ms:`, error.message);

       //if the model fails, then fallback
       if(modelName === modelNames[modelNames.length - 1]){
         console.log('🔄 All models failed, returning fallback recipe');
         return  {
           success: false,
           error: `All AI models failed. Last error: ${error.message}`,
           fallback: generateFallbackRecipe(ingredients, cuisineType, dietaryNeeds, cookingTime, servings)
         };
       }
       
       // Continue to next model
       continue;
     }
   }
};

// Fallback recipe generation if AI fails
const generateFallbackRecipe = (ingredients, cuisineType, dietaryNeeds, cookingTime, servings) => {
  const ingredientList = ingredients.split(',').map(item => item.trim()).filter(item => item);
  
  return {
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
};

// Generate multiple recipe suggestions
export const generateMultipleRecipesWithAI = async (ingredients, cuisineType, dietaryNeeds, cookingTime, servings) => {
  const startTime = Date.now();
  console.log('🔥 Starting multiple recipes generation...');
  
  const modelNames = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
  for(const modelName of modelNames) {
    try {
      console.log(`⏳ Trying Model: ${modelName} for multiple recipes at ${new Date().toLocaleTimeString()}`);

      const model = genAI.getGenerativeModel({model: modelName});

      const prompt = `You are a world-class chef and recipe expert. A user has the following ingredients: ${ingredients}.
      
      Additional preferences:
      - Cuisine Type: ${cuisineType || 'any'}
      - Dietary Needs: ${dietaryNeeds || 'any'}
      - Cooking Time: ${cookingTime || 'any'}
      - Servings: ${servings || 'any'}
      
      Generate 3 different creative recipes that can be made with these ingredients. Each recipe should be unique and practical.
      It is NOT mandatory to use every single ingredient — feel free to mix and match the provided ingredients in unique and sensible ways.
      Respond with ONLY a valid JSON array of recipe objects. Each recipe object schema must be exactly:
      {
        "recipeName": "string",
        "description": "string (brief description of the dish)",
        "rating": "number (4.0-5.0)",
        "totalTime": "string (eg. '30 minutes')",
        "prepTime": "string (eg. '10 minutes')",
        "servings": "string (number of servings)",
        "calories": "number (estimated calories per serving)",
        "cuisine": "string (cuisine type)",
        "difficulty": "string (Easy/Medium/Hard)",
        "tags": ["string array of relevant tags"],
        "ingredients": [
          {
            "name": "string (ingredient name)",
            "quantity": "string (amount needed)",
            "essential": "boolean (true if from user's list)"
          }
        ],
        "instructions": [
          {
            "step": "number",
            "description": "string (detailed instruction)",
            "time": "string (time for this step)"
          }
        ],
        "nutrition": {
          "calories": "number",
          "protein": "string (with unit)",
          "carbs": "string (with unit)",
          "fat": "string (with unit)",
          "fiber": "string (with unit)",
          "sugar": "string (with unit)"
        },
        "tips": [
          "string (helpful cooking tips)"
        ]
      }

      Make sure the response is a valid JSON array with exactly 3 recipes, no additional text or formatting.`;

      console.log(`📤 Sending multiple recipes request to ${modelName}...`);
      const result = await makeAIRequestWithTimeout(model, prompt, 40000); // 40 second timeout for multiple recipes
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
        console.log('Raw AI response:', text);
        throw new Error('Failed to parse AI response for multiple recipes');
      }

      // Validate the response structure
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

      const totalTime = Date.now() - startTime;
      console.log(`✅ AI generated ${recipesData.length} recipes successfully with model ${modelName} in ${totalTime}ms`);
      return { success: true, data: recipesData };
    } catch (error) {
      const errorTime = Date.now() - startTime;
      console.error(`❌ Error with model ${modelName} after ${errorTime}ms:`, error.message);

      // If this is the last model, try single recipe generation as fallback
      if (modelName === modelNames[modelNames.length - 1]) {
        console.log('🔄 All models failed for multiple recipes, trying single recipe generation...');
        
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

  return recipes;
};

// Debug function to check API and network status
export const debugAIService = async () => {
  console.log('🔍 Starting AI Service Debug...');
  
  const debugInfo = {
    apiKeyStatus: 'Unknown',
    networkStatus: 'Unknown',
    modelAvailability: {},
    timestamp: new Date().toISOString()
  };

  // Check API Key
  try {
    if (!GEMINI_API_KEY) {
      debugInfo.apiKeyStatus = 'Missing';
      console.log('❌ API Key is missing');
    } else if (GEMINI_API_KEY.length < 10) {
      debugInfo.apiKeyStatus = 'Invalid';
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
      method: 'HEAD',
      timeout: 5000 
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
    console.log('❌ Network is disconnected:', error.message);
  }

  // Test each model with a simple prompt
  const testModels = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
  
  for (const modelName of testModels) {
    try {
      console.log(`🧪 Testing model: ${modelName}`);
      const model = genAI.getGenerativeModel({model: modelName});
      
      const startTime = Date.now();
      const result = await makeAIRequestWithTimeout(
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
    
    const result = await makeAIRequestWithTimeout(
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
  debugAIService,
  quickHealthCheck
}; 
