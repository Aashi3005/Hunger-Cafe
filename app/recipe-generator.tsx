import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { generateRecipeWithAI } from '../services/aiService';
import { signOutUser } from '../services/authService';

export default function RecipeGeneratorScreen() {
  const [ingredients, setIngredients] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [dietaryNeeds, setDietaryNeeds] = useState('');
  const [cookingTime, setCookingTime] = useState('');
  const [servings, setServings] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateRecipe = async () => {
    if (!ingredients.trim()) {
      Alert.alert('Error', 'Please enter at least one ingredient');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Use AI service to generate recipe
      const result = await generateRecipeWithAI(
        ingredients,
        cuisineType,
        dietaryNeeds,
        cookingTime,
        servings
      );

      setIsGenerating(false);

      if (result && result.success) {
        // Navigate to recipe detail screen with AI-generated data
        router.push({
          pathname: '/recipe-detail',
          params: {
            recipe: JSON.stringify(result.data)
          }
        });
      } else if (result && result.fallback) {
        // Automatically use fallback recipe without showing technical error
        console.log('AI failed, using fallback:', result.error);
        
        // Show a friendly message and proceed with fallback
        Alert.alert(
          'Recipe Generated!',
          'We\'ve created a delicious recipe for you! (Note: AI service is temporarily unavailable, but we got you covered)',
          [
            {
              text: 'View Recipe',
              onPress: () => {
                router.push({
                  pathname: '/recipe-detail',
                  params: {
                    recipe: JSON.stringify(result.fallback)
                  }
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Unable to generate recipe. Please try again.');
      }
    } catch (error) {
      setIsGenerating(false);
      Alert.alert('Error', 'Failed to generate recipe. Please check your internet connection and try again.');
      console.error('Recipe generation error:', error);
    }
  };

  const handleQuickRecipe = async (recipeName: string) => {
    // Generate recipe data for quick recipes using AI
    const quickRecipeData = {
      'Pasta with Tomatoes': {
        ingredients: 'pasta, tomatoes, garlic, basil, olive oil',
        cuisineType: 'Italian',
        dietaryNeeds: 'Vegetarian',
        cookingTime: '30 min',
        servings: '4'
      },
      'Chicken Stir Fry': {
        ingredients: 'chicken breast, mixed vegetables, soy sauce, ginger, garlic',
        cuisineType: 'Asian',
        dietaryNeeds: '',
        cookingTime: '25 min',
        servings: '3'
      },
      'Vegetable Soup': {
        ingredients: 'mixed vegetables, vegetable broth, herbs, onion, celery',
        cuisineType: 'Comfort Food',
        dietaryNeeds: 'Vegetarian',
        cookingTime: '40 min',
        servings: '6'
      },
      'Grilled Salmon': {
        ingredients: 'salmon fillets, lemon, fresh herbs, olive oil',
        cuisineType: 'Mediterranean',
        dietaryNeeds: 'Keto',
        cookingTime: '20 min',
        servings: '2'
      },
      'Chocolate Cake': {
        ingredients: 'flour, cocoa powder, eggs, sugar, butter, baking powder',
        cuisineType: 'Dessert',
        dietaryNeeds: '',
        cookingTime: '60 min',
        servings: '8'
      }
    };

    const recipeInfo = quickRecipeData[recipeName as keyof typeof quickRecipeData];
    if (recipeInfo) {
      setIsGenerating(true);
      
      try {
        const result = await generateRecipeWithAI(
          recipeInfo.ingredients,
          recipeInfo.cuisineType,
          recipeInfo.dietaryNeeds,
          recipeInfo.cookingTime,
          recipeInfo.servings
        );

        setIsGenerating(false);

        if (result && result.success) {
          router.push({
            pathname: '/recipe-detail',
            params: {
              recipe: JSON.stringify(result.data)
            }
          });
        } else if (result && result.fallback) {
          // Automatically use fallback for quick recipes
          console.log('Quick recipe AI failed, using fallback:', result.error);
          
          router.push({
            pathname: '/recipe-detail',
            params: {
              recipe: JSON.stringify(result.fallback)
            }
          });
        } else {
          Alert.alert('Error', 'Unable to generate quick recipe. Please try again.');
        }
      } catch (error) {
        setIsGenerating(false);
        Alert.alert('Error', 'Failed to generate quick recipe. Please check your connection.');
        console.error('Quick recipe generation error:', error);
      }
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            await signOutUser();
            router.replace('/');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <View style={styles.iconPlaceholder}>
                <Text style={styles.iconText}>🍳</Text>
              </View>
              <Text style={styles.appTitle}>HungerQuest</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>AI Recipe Generator</Text>
        </View>

        {/* Generate Recipe Form */}
        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <Text style={styles.formIcon}>🤖</Text>
            <Text style={styles.formTitle}>Generate Your Recipe with AI</Text>
          </View>

          <Text style={styles.label}>Available Ingredients</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., chicken, tomatoes, garlic, onions..."
            value={ingredients}
            onChangeText={setIngredients}
            multiline
            placeholderTextColor="#999"
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Cuisine Type</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Italian, Asian, Mexican..."
                value={cuisineType}
                onChangeText={setCuisineType}
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Dietary Needs</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Vegetarian, Keto..."
                value={dietaryNeeds}
                onChangeText={setDietaryNeeds}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Cooking Time</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 30 minutes"
                value={cookingTime}
                onChangeText={setCookingTime}
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Servings</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 4 people"
                value={servings}
                onChangeText={setServings}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
            onPress={handleGenerateRecipe}
            disabled={isGenerating}
          >
            <Text style={styles.generateButtonIcon}>🤖</Text>
            <Text style={styles.generateButtonText}>
              {isGenerating ? 'AI is Generating Recipe...' : 'Generate Recipe with AI'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Recipe Ideas */}
        <View style={styles.quickRecipesContainer}>
          <View style={styles.quickRecipesHeader}>
            <Text style={styles.quickRecipesIcon}>⚡</Text>
            <Text style={styles.quickRecipesTitle}>Quick AI Recipe Ideas</Text>
          </View>

          <View style={styles.quickRecipesGrid}>
            <TouchableOpacity 
              style={[styles.quickRecipeCard, isGenerating && styles.quickRecipeCardDisabled]}
              onPress={() => handleQuickRecipe('Pasta with Tomatoes')}
              disabled={isGenerating}
            >
              <Text style={styles.quickRecipeText}>Pasta with Tomatoes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickRecipeCard, isGenerating && styles.quickRecipeCardDisabled]}
              onPress={() => handleQuickRecipe('Chicken Stir Fry')}
              disabled={isGenerating}
            >
              <Text style={styles.quickRecipeText}>Chicken Stir Fry</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickRecipeCard, isGenerating && styles.quickRecipeCardDisabled]}
              onPress={() => handleQuickRecipe('Vegetable Soup')}
              disabled={isGenerating}
            >
              <Text style={styles.quickRecipeText}>Vegetable Soup</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickRecipeCard, isGenerating && styles.quickRecipeCardDisabled]}
              onPress={() => handleQuickRecipe('Grilled Salmon')}
              disabled={isGenerating}
            >
              <Text style={styles.quickRecipeText}>Grilled Salmon</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickRecipeCard, isGenerating && styles.quickRecipeCardDisabled]}
              onPress={() => handleQuickRecipe('Chocolate Cake')}
              disabled={isGenerating}
            >
              <Text style={styles.quickRecipeText}>Chocolate Cake</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Why Choose Section */}
        <View style={styles.whyChooseContainer}>
          <Text style={styles.whyChooseTitle}>Why Choose AI Recipe Generator?</Text>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>🤖</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Powered by Google Gemini AI</Text>
              <Text style={styles.featureDescription}>
                Get personalized, creative recipes generated by advanced AI based on your exact ingredients and preferences
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8DDD4',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#E8DDD4',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ED5565',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ED5565',
  },
  logoutButton: {
    backgroundColor: '#ED5565',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#ED5565',
    marginTop: 5,
    fontWeight: '600',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  formIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ED5565',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  generateButton: {
    backgroundColor: '#ED5565',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  generateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  generateButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickRecipesContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickRecipesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  quickRecipesIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  quickRecipesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ED5565',
  },
  quickRecipesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickRecipeCard: {
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 8,
    width: '48%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  quickRecipeCardDisabled: {
    backgroundColor: '#F0F0F0',
    opacity: 0.6,
  },
  quickRecipeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  whyChooseContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  whyChooseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ED5565',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ED5565',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureIconText: {
    fontSize: 20,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 