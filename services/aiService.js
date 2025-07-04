import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "@/config/apiConfig";

// initialize krre h Gemini AI Client
const genAI = new GoogleGenerativeAI({GEMINI_API_KEY});

export const generateRecipeWithAI = async (ingredients, cuisineType, dietaryNeeds, cookingTime, servings) =>{
  // different model names when one is not available
  const modelNames = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.5-ultra'];
  for(const modelName of modelNames) {
    try {
      console.log(`trying Model: ${modelName}`);

      // get the generative model which we are using
      const model = genAI.getGenerativeModel({model: modelName});

      // generating the construct prompt 
      const prompt = `You are a world-class chef and recipe expert. A user has the following ingredients : ${ingredients}.
      
      Additional preferences:
      -Cuisine Type : ${cuisineType || any}
      -Dietary Needs : ${dietaryNeeds || any}
      -Cooking Time : ${cookingTime || any}
      -Servings : ${servings || any}
      Generate 1 detailed recipe that includes the ingredoents. The recipe should be creative, practical and delicious.
      Respond with ONLY a valid JSON object. The schema must be exactly:
      {
      "recipeName": "string",
      "ingredients": "string (brief description of the dish)",
      "rating": number (4.0-5.0),
      "totalTime": "string (eg. '30 minutes')",
      "prepTime": "string (eg. '10 minutes')",
      "servings": number,
      "calories": number,
      "cuisineType": "string (eg. 'Italian')",
      "difficulty": "string (eg. 'Easy, Medium, Hard')",
      "tags": "string (eg. 'vegetarian, gluten-free')",
      "ingredients":[
      {
      "name": "string(ingredients name)",
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

  //Generating the prompt response
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  //Parse the JSON response
  let recipeData;
  try{
    //clean the response text with extra trim or any markdown formatting
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    recipeData = JSON.parse(cleanText);
  } catch (parseError){
    console.error("error parsing AI response:", parseError);
    console.log('Raw AI response:', text);
    throw new Error('Failed to parse AI response');
  }
  //Validate the response structure
  if(!recipeData.recipeName || !recipeData.ingredients || !recipeData.instructions){
    throw new Error ('Invalid recipe data structure from AI');
  }
  // Additional computed fields
  recipeData.rating = Math.floor(Math.renadom() * 500)+ 100;
  recipeData.Title = recipeData.recipeName;
  recipeData.image = `https://source.unsplash.com/featured/?${encodeURIComponent(recipeData.recipeName)}`;

  console.log(`AI recipe generated successfully: with model ${modelName}:`, recipeData.recipeName );
  return {success: true, data: recipeData};
    }catch (error) {
      console.error(`Error with model ${modelName}:`, error.message);


      //if the model fails, then fallback
      if(modelName === modelNames[modelNames.length - 1]){
        console.log('All models failed, returning fallback recipe');
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

export default {
  generateRecipeWithAI
}; 
