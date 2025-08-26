import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
import { debugAIService, generateMultipleRecipesWithAI, quickHealthCheck, resetQuotaCounter } from '../services/aiService';
import { signOutUser } from '../services/authService';
import { RecipeStorage } from '../services/recipeStorage';
import { voiceToTextService } from '../services/voiceToTextService';

export default function RecipeGeneratorScreen() {
  const [ingredients, setIngredients] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [dietaryNeeds, setDietaryNeeds] = useState('');
  const [cookingTime, setCookingTime] = useState('');
  const [servings, setServings] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [likedCount, setLikedCount] = useState(0);
  const [bookmarkedCount, setBookmarkedCount] = useState(0);
  // States for voice-to-text
  const [isListening, setIsListening] = useState(false);
  const [partialText, setPartialText] = useState('');
  
  // Add debug state
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  // Cafe mode popup state
  const [showCafeModePopup, setShowCafeModePopup] = useState(false);

  // Loading progress state
  const [loadingProgress, setLoadingProgress] = useState('');

  // Load recipe counts function
  const loadRecipeCounts = useCallback(async () => {
    try {
      const [likedRecipes, bookmarkedRecipes] = await Promise.all([
        RecipeStorage.getLikedRecipes(),
        RecipeStorage.getBookmarkedRecipes()
      ]);
      setLikedCount(likedRecipes.length);
      setBookmarkedCount(bookmarkedRecipes.length);
    } catch (error) {
      console.error('Error loading recipe counts:', error);
    }
  }, []);

  // Load recipe counts on component mount
  useEffect(() => {
    loadRecipeCounts();
  }, [loadRecipeCounts]);

  // Setup voice service callbacks
  useEffect(() => {
    voiceToTextService.setCallbacks({
      onSpeechStart: () => {
        console.log('Speech started');
        setIsListening(true);
        setPartialText('');
      },
      onSpeechEnd: () => {
        console.log('Speech ended');
        setIsListening(false);
        setPartialText('');
      },
      onSpeechResult: (text: string) => {
        console.log('Speech result:', text);
        // Just add the text, don't stop recording automatically
        const newIngredients = ingredients.trim() 
          ? `${ingredients}, ${text}` 
          : text;
        setIngredients(newIngredients);
        // Clear partial text but keep recording
        setPartialText('');
      },
      onSpeechError: (error: any) => {
        console.error('Speech recognition error:', error);
        setIsListening(false);
        setPartialText('');
        Alert.alert('Voice Error', 'Could not recognize speech. Please try again.');
      },
      onSpeechPartialResults: (results: string[]) => {
        console.log('Partial results:', results);
        // Show partial results in real-time
        if (results && results.length > 0) {
          setPartialText(results[0]);
        }
      }
    });

    // Cleanup function
    return () => {
      voiceToTextService.destroy();
    };
  }, []); // Remove ingredients dependency to prevent callback reset

  // Refresh counts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadRecipeCounts();
    }, [loadRecipeCounts])
  );


  // Handle microphone button press - Classic toggle method
  const handleMicPress = async () => {
    try {
      if (isListening) {
        // Stop listening - user clicked to stop
        console.log('User stopping voice recognition...');
        await voiceToTextService.stopListening();
      } else {
        // Start listening - user clicked to start
        console.log('User starting voice recognition...');
        
        // Configure voice recognition
        const voiceOptions = {
          locale: 'en-US',
        };
        
        // Start listening
        await voiceToTextService.startListening(voiceOptions);
      }
    } catch (error: any) {
      console.error('Voice recognition error:', error);
      setIsListening(false);
      setPartialText('');
      
      // Provide more specific error messages
      let errorMessage = 'Failed to use voice recognition. Please check microphone permissions.';
      
      if (error instanceof Error) {
        if (error.message.includes('not available')) {
          errorMessage = 'Speech recognition is not available on this device.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'Microphone permission denied. Please enable microphone access in settings.';
        }
      }
      
      Alert.alert('Voice Error', errorMessage);
    }
  };

  const handleGenerateRecipe = async () => {
    if (!ingredients.trim()) {
      Alert.alert('Error', 'Please enter at least one ingredient');
      return;
    }

    setIsGenerating(true);
    setLoadingProgress('Connecting to AI...');
    
    try {
      // Use AI service to generate multiple recipes
      const result = await generateMultipleRecipesWithAI(
        ingredients,
        cuisineType,
        dietaryNeeds,
        cookingTime,
        servings
      );

      setIsGenerating(false);
      setLoadingProgress('');

      if (result && result.success) {
        if (result.fallbackUsed) {
          Alert.alert(
            'Recipe Generated! ✅',
            'Multiple recipes generation had issues, but we generated a great recipe for you!',
            [
              {
                text: 'View Recipe',
                onPress: () => {
                  router.push({
                    pathname: '/recipe-suggestions',
                    params: {
                      recipes: JSON.stringify(result.data)
                    }
                  });
                }
              }
            ]
          );
        } else {
          // Navigate to recipe suggestions screen with AI-generated data
          router.push({
            pathname: '/recipe-suggestions',
            params: {
              recipes: JSON.stringify(result.data)
            }
          });
        }
      } else if (result && result.fallback) {
        // Automatically use fallback recipes without showing technical error
        console.log('AI failed, using fallback:', result.error);
        
        // Show a friendly message and proceed with fallback
        Alert.alert(
          'Recipes Generated!',
          'We\'ve created a delicious recipe for you! (Note: AI service is temporarily unavailable, but we got you covered)',
          [
            {
              text: 'View Suggestions',
              onPress: () => {
                router.push({
                  pathname: '/recipe-suggestions',
                  params: {
                    recipes: JSON.stringify(result.fallback)
                  }
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Unable to generate recipe suggestions. Please try again.');
      }
    } catch (error: any) {
      setIsGenerating(false);
      setLoadingProgress('');
      Alert.alert('Error', 'Failed to generate recipe suggestions. Please check your internet connection and try again.');
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
        // For quick recipes, we'll generate multiple options using the same ingredients
        const result = await generateMultipleRecipesWithAI(
          recipeInfo.ingredients,
          recipeInfo.cuisineType,
          recipeInfo.dietaryNeeds,
          recipeInfo.cookingTime,
          recipeInfo.servings
        );

        setIsGenerating(false);

        if (result && result.success) {
          router.push({
            pathname: '/recipe-suggestions',
            params: {
              recipes: JSON.stringify(result.data)
            }
          });
        } else if (result && result.fallback) {
          // Automatically use fallback for quick recipes
          console.log('Quick recipe AI failed, using fallback:', result.error);
          
          router.push({
            pathname: '/recipe-suggestions',
            params: {
              recipes: JSON.stringify(result.fallback)
            }
          });
        } else {
          Alert.alert('Error', 'Unable to generate quick recipe suggestions. Please try again.');
        }
      } catch (error) {
        setIsGenerating(false);
        Alert.alert('Error', 'Failed to generate quick recipe suggestions. Please check your connection.');
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
            // Reset counts before logout
            setLikedCount(0);
            setBookmarkedCount(0);
            
            await signOutUser();
            router.replace('/');
          }
        }
      ]
    );
  };

  // Debug function
  const handleDebugAI = async () => {
    setIsDebugging(true);
    try {
      console.log('🔍 Starting debug from UI...');
      const debugResult = await debugAIService();
      setDebugInfo(debugResult);
      
      // Show user-friendly debug info
      let debugMessage = `Debug Report (${new Date().toLocaleTimeString()}):\n\n`;
      debugMessage += `🔑 API Key: ${debugResult.apiKeyStatus}\n`;
      debugMessage += `🌐 Network: ${debugResult.networkStatus}\n\n`;
      
      // Add quota information
      if (debugResult.quotaStatus) {
        debugMessage += `📊 Quota Status:\n`;
        debugMessage += `• Requests used: ${debugResult.quotaStatus.requestCount}/${debugResult.quotaStatus.maxRequests}\n`;
        debugMessage += `• Status: ${debugResult.quotaStatus.quotaExceeded ? 'EXCEEDED' : 'OK'}\n\n`;
      }
      
      debugMessage += `🤖 Model Status:\n`;
      Object.entries(debugResult.modelAvailability).forEach(([model, info]: [string, any]) => {
        debugMessage += `• ${model}: ${info.status}`;
        if (info.responseTime) {
          debugMessage += ` (${info.responseTime}ms)`;
        }
        debugMessage += '\n';
      });
      
      // Add recommendations
      if (debugResult.recommendations && debugResult.recommendations.length > 0) {
        debugMessage += `\n💡 Recommendations:\n`;
        debugResult.recommendations.forEach((rec: string) => {
          debugMessage += `• ${rec}\n`;
        });
      }
      
      Alert.alert('AI Service Debug Report', debugMessage);
    } catch (error: any) {
      console.error('Debug failed:', error);
      Alert.alert('Debug Error', `Failed to run debug: ${error.message}`);
    } finally {
      setIsDebugging(false);
    }
  };

  // Quota reset function
  const handleQuotaReset = () => {
    Alert.alert(
      'Reset Quota Counter',
      'This will reset the local quota counter. Use this if you want to try the AI service again after waiting for quota reset.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: () => {
            resetQuotaCounter();
            Alert.alert('Success', 'Quota counter has been reset. You can now try generating recipes again.');
          }
        }
      ]
    );
  };

  // Quick health check
  const handleQuickHealthCheck = async () => {
    try {
      const healthResult = await quickHealthCheck();
      if (healthResult.healthy) {
        Alert.alert(
          'AI Service Health Check ✅',
          `Service is healthy! Response time: ${healthResult.responseTime}ms`
        );
      } else {
        Alert.alert(
          'AI Service Health Check ❌',
          `Service is having issues: ${healthResult.error}`
        );
      }
    } catch (error: any) {
      Alert.alert('Health Check Error', `Failed to check health: ${error.message}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Cafe Mode Popup - Outside ScrollView for proper centering */}
      {showCafeModePopup && (
        <View style={styles.popupOverlay}>
          <TouchableOpacity 
            activeOpacity={1}
            onPress={() => setShowCafeModePopup(false)}
          >
            <View style={styles.popupContainer}>
              <TouchableOpacity 
                activeOpacity={1}
                onPress={() => {}} // Prevent closing when clicking inside popup
              >
                <View style={styles.popupHeader}>
                  <View style={styles.popupIconContainer}>
                    <Text style={styles.popupIcon}>🏪</Text>
                  </View>
                  <Text style={styles.popupTitle}>Switch to Cafe Mode</Text>
                  <Text style={styles.popupSubtitle}>Start managing your cafe delivery app</Text>
                </View>
                
                <View style={styles.popupActions}>
                  <TouchableOpacity 
                    style={styles.popupButton}
                    onPress={() => {
                      setShowCafeModePopup(false);
                      // Here you can add navigation to cafe mode
                      Alert.alert('Cafe Mode', 'Switching to cafe delivery mode...');
                    }}
                  >
                    <Text style={styles.popupButtonText}>Switch to Cafe Mode</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.popupCancelButton}
                    onPress={() => setShowCafeModePopup(false)}
                  >
                    <Text style={styles.popupCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <TouchableOpacity onPress={() => router.push('/profile')} style={styles.iconPlaceholder}>
                <Text style={styles.iconText}>🍳</Text>
              </TouchableOpacity>
              <Text style={styles.appTitle}>HungerQuest</Text>
            </View>
            <TouchableOpacity onPress={() => setShowCafeModePopup(true)} style={styles.cafeModeButton}>
              <Text style={styles.cafeModeIcon}>⚡</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>AI Recipe Generator</Text>
          
          {/* Quick Access Navigation */}
          <View style={styles.quickAccessContainer}>
            <TouchableOpacity 
              style={styles.quickAccessButton}
              onPress={async () => {
                await loadRecipeCounts();
                router.push('/liked-recipes');
              }}
            >
              <Text style={styles.quickAccessIcon}>❤️</Text>
              <View style={styles.quickAccessTextContainer}>
                <Text style={styles.quickAccessText}>Liked Recipes</Text>
                <Text style={styles.quickAccessCount}>{likedCount}</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAccessButton}
              onPress={async () => {
                await loadRecipeCounts();
                router.push('/bookmarked-recipes');
              }}
            >
              <Text style={styles.quickAccessIcon}>🔖</Text>
              <View style={styles.quickAccessTextContainer}>
                <Text style={styles.quickAccessText}>Bookmarked</Text>
                <Text style={styles.quickAccessCount}>{bookmarkedCount}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Generate Recipe Form */}
        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <Text style={styles.formIcon}>🤖</Text>
            <Text style={styles.formTitle}>Generate Your Recipes with AI</Text>
          </View>

          <Text style={styles.label}>Available Ingredients</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.inputWithMic]}
              placeholder="e.g., chicken, tomatoes, garlic, onions... (Tap mic to speak)"
              value={ingredients}
              onChangeText={setIngredients}
              multiline
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={[
                styles.micButton,
                isListening && styles.micButtonListening,
              ]}
              onPress={handleMicPress}
            >
              <Text style={styles.micIcon}>
                {isListening ? '🔴' : '🎤'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {isListening && (
            <Text style={styles.listeningText}>
              🎙️ Listening... Speak your ingredients now!
            </Text>
          )}
          
          {partialText && (
            <Text style={styles.partialText}>
              Recognizing: "{partialText}"
            </Text>
          )}

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
              {isGenerating ? loadingProgress || 'AI is Generating Recipes...' : 'Generate Recipe with AI'}
            </Text>
          </TouchableOpacity>
          
          {/* Loading Progress */}
          {isGenerating && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>
                {loadingProgress || 'Please wait...'}
              </Text>
              <Text style={styles.loadingSubText}>
                This may take 10-30 seconds depending on AI availability
              </Text>
            </View>
          )}
        </View>

        {/* Quick Recipe Ideas */}
        <View style={styles.quickRecipesContainer}>
          <View style={styles.quickRecipesHeader}>
            <Text style={styles.quickRecipesIcon}>⚡</Text>
            <Text style={styles.quickRecipesTitle}>Quick AI Recipe Categories</Text>
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

        {/* Debug Section - Show when generating fails */}
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>🔧 Debug & Troubleshooting</Text>
          <Text style={styles.debugDescription}>
            If recipes are taking too long to generate or showing quota errors, use these tools:
          </Text>
          
          <View style={styles.debugButtons}>
            <TouchableOpacity 
              style={[styles.debugButton, isDebugging && styles.debugButtonDisabled]}
              onPress={handleQuickHealthCheck}
              disabled={isDebugging || isGenerating}
            >
              <Text style={styles.debugButtonText}>
                {isDebugging ? 'Checking...' : 'Quick Health Check'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.debugButton, styles.debugButtonDetailed, isDebugging && styles.debugButtonDisabled]}
              onPress={handleDebugAI}
              disabled={isDebugging || isGenerating}
            >
              <Text style={styles.debugButtonText}>
                {isDebugging ? 'Debugging...' : 'Detailed Debug'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.debugButton, styles.debugButtonReset]}
            onPress={handleQuotaReset}
            disabled={isDebugging || isGenerating}
          >
            <Text style={styles.debugButtonText}>
              Reset Quota Counter
            </Text>
          </TouchableOpacity>
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
                Get multiple personalized, creative recipe options generated by advanced AI based on your exact ingredients and preferences
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
  cafeModeButton: {
    backgroundColor: '#ED5565',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cafeModeIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#ED5565',
    marginTop: 5,
    fontWeight: '600',
  },
  quickAccessContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  quickAccessButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  quickAccessIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  quickAccessTextContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  quickAccessText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  quickAccessCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ED5565',
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
  inputWithMic: {
    paddingRight: 50, // Make space for mic button
  },
  inputContainer: {
    position: 'relative',
  },
  micButton: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -15 }],
    backgroundColor: '#ED5565',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  micButtonListening: {
    backgroundColor: '#FF6B6B', // Redder when recording
  },
  micIcon: {
    fontSize: 20,
    color: '#FFFFFF',
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
  listeningText: {
    fontSize: 16,
    color: '#ED5565',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
  },
  partialText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '500',
  },
  debugContainer: {
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
  debugTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ED5565',
    marginBottom: 12,
  },
  debugDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  debugButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  debugButton: {
    flex: 1,
    backgroundColor: '#ED5565',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  debugButtonDetailed: {
    backgroundColor: '#4CAF50',
  },
  debugButtonReset: {
    backgroundColor: '#FF9800',
    marginTop: 10,
  },
  debugButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  debugButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  loadingSubText: {
    fontSize: 12,
    color: '#666',
  },
  
  // Cafe Mode Popup Styles
  popupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80, // Adjust to center above the form
  },
  popupContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: 320,
    width: '100%',
  },
  popupHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  popupIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  popupIcon: {
    fontSize: 40,
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  popupSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  popupActions: {
    gap: 12,
  },
  popupButton: {
    backgroundColor: '#ED5565',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  popupCancelButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupCancelText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
}); 