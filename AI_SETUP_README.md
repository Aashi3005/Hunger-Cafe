# 🤖 AI Recipe Generator Setup Guide

This guide will help you set up the Google Gemini AI integration for your recipe generator app.

## 📋 Prerequisites

- Node.js and npm installed
- React Native development environment set up
- Google account for accessing Google AI Studio

## 🔧 Setup Instructions

### Step 1: Get Your Google Gemini API Key

1. **Go to Google AI Studio**: Visit [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)

2. **Sign in**: Use your Google account to sign in

3. **Create API Key**: 
   - Click "Create API Key"
   - Select a Google Cloud project (or create a new one)
   - Copy the generated API key

4. **Save Your API Key**: Keep it secure and don't share it publicly

### Step 2: Configure the App

1. **Open the config file**: Navigate to `config/apiConfig.js`

2. **Replace the API key**: 
   ```javascript
   // Replace this line:
   export const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';
   
   // With your actual API key:
   export const GEMINI_API_KEY = 'your-actual-api-key-here';
   ```

3. **Save the file**: Make sure to save the changes

### Step 3: Install Dependencies

Make sure you have the Google Generative AI package installed:

```bash
npm install @google/generative-ai
```

### Step 4: Test the Integration

1. **Run the app**: Start your React Native app
2. **Navigate to Recipe Generator**: Login and go to the recipe generator screen
3. **Enter ingredients**: Add some ingredients like "chicken, tomatoes, onions"
4. **Generate recipe**: Click the "Generate Recipe with AI" button
5. **View results**: The AI should generate a detailed recipe for you

## 🚀 How It Works

### AI Prompt Structure
The app sends a structured prompt to Google Gemini AI that includes:
- User's available ingredients
- Cuisine type preference
- Dietary restrictions
- Cooking time preference
- Number of servings

### AI Response Format
The AI returns a structured JSON object with:
- Recipe name and description
- Detailed ingredient list with quantities
- Step-by-step cooking instructions
- Nutritional information
- Cooking tips and techniques

### Fallback System
If the AI fails to generate a recipe, the app automatically uses a fallback recipe generator to ensure users always get a response.

## 🔍 Example AI Prompt

```
You are a creative chef and recipe expert. A user has the following ingredients: chicken, tomatoes, garlic, onions.

Additional preferences:
- Cuisine Type: Italian
- Dietary Needs: none
- Cooking Time: 30 minutes
- Servings: 4

Generate 1 detailed recipe that uses these ingredients. The recipe should be creative, practical, and delicious.

Respond with ONLY a valid JSON object...
```

## 📱 Features

- **Real-time AI generation**: Recipes are generated using Google Gemini AI
- **Personalized results**: Based on user's specific ingredients and preferences
- **Detailed recipes**: Complete with ingredients, instructions, nutrition, and tips
- **Quick recipe options**: Pre-defined recipes also use AI generation
- **Error handling**: Fallback system ensures app reliability

## 🔐 Security Notes

- **Never commit your API key**: Add `config/apiConfig.js` to `.gitignore`
- **Use environment variables**: For production, use environment variables
- **Monitor usage**: Keep track of your API usage in Google Cloud Console

## 🆘 Troubleshooting

### Common Issues

1. **"API key not found" error**: Make sure you've updated the API key in `config/apiConfig.js`

2. **"Network error"**: Check your internet connection and API key validity

3. **"JSON parsing error"**: The AI response might be malformed - the fallback system will handle this

4. **"Rate limit exceeded"**: You've exceeded the API quota - check your Google Cloud Console

5. **"Model not found" error** ⚠️ **MOST COMMON ISSUE**:
   - Error message: `models/gemini-pro is not found for API version v1beta`
   - **Solution**: The app automatically tries multiple model names (`gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-pro`)
   - If all models fail, it will automatically use the fallback recipe system
   - **What to do**: Nothing! The app handles this gracefully and shows a friendly message

### Model Availability Issues

Google occasionally updates their available models. The app is designed to:
- ✅ Try multiple model names automatically
- ✅ Fall back to local recipe generation if AI fails
- ✅ Show user-friendly messages instead of technical errors
- ✅ Continue working even when AI is unavailable

### Debug Mode

You can enable debug logging by checking the console for:
- AI response logs
- Error messages
- Recipe generation success/failure
- Model selection attempts

### Expected Behavior When AI Fails

When AI services are unavailable, users will see:
- A loading message: "AI is Generating Recipe..."
- A friendly success message: "Recipe Generated! (Note: AI service is temporarily unavailable, but we got you covered)"
- A fully functional recipe with all details

This ensures your app **always works** regardless of AI service status.

## 🎯 Expected Results

When working properly, you should see:
- ✅ Creative, personalized recipes
- ✅ Detailed ingredient lists with quantities
- ✅ Step-by-step cooking instructions
- ✅ Nutritional information
- ✅ Professional cooking tips
- ✅ Recipes that actually use your ingredients

## 📊 API Usage

The free tier of Google Gemini API includes:
- 60 requests per minute
- 100,000 requests per month
- Rate limiting may apply

For production use, consider upgrading to a paid plan for higher limits.

## 🔄 Alternative AI Providers

If you want to use a different AI provider, you can modify the `services/aiService.js` file to integrate with:
- OpenAI GPT
- Anthropic Claude
- Azure OpenAI
- Any other AI API that supports text generation

Just make sure to update the prompt structure and response parsing accordingly.

---

**Happy Cooking! 🍳** 