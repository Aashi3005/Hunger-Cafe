import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { RecipeStorage, type Recipe } from '../services/recipeStorage';

export default function RecipeDetailScreen() {
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('ingredients');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // Parse the recipe data from params
  const recipeData = params.recipe ? JSON.parse(params.recipe as string) : null;

  // Add unique ID to recipe if it doesn't have one
  const recipe: Recipe = recipeData ? {
    ...recipeData,
    id: recipeData.id || `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  } : null;

  // Load initial like/bookmark state from AsyncStorage
  useEffect(() => {
    const loadInitialState = async () => {
      if (recipe) {
        try {
          const [isLikedState, isBookmarkedState] = await Promise.all([
            RecipeStorage.isRecipeLiked(recipe.id),
            RecipeStorage.isRecipeBookmarked(recipe.id)
          ]);
          setIsLiked(isLikedState);
          setIsBookmarked(isBookmarkedState);
        } catch (error) {
          console.error('Error loading initial state:', error);
        }
      }
    };

    loadInitialState();
  }, [recipe?.id]);

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Recipe not found</Text>
      </SafeAreaView>
    );
  }

  const handleBack = () => {
    router.back();
  };

  const handleBookmark = async () => {
    try {
      const newBookmarkedState = !isBookmarked;
      setIsBookmarked(newBookmarkedState);
      
      if (newBookmarkedState) {
        await RecipeStorage.addBookmarkedRecipe(recipe);
        Alert.alert('Added to bookmarks', 'Recipe saved to your bookmarks');
      } else {
        await RecipeStorage.removeBookmarkedRecipe(recipe.id);
        Alert.alert('Removed from bookmarks', 'Recipe removed from your bookmarks');
      }
    } catch (error) {
      console.error('Error updating bookmark:', error);
      setIsBookmarked(!isBookmarked); // Revert state on error
      Alert.alert('Error', 'Failed to update bookmark');
    }
  };

  const handleLike = async () => {
    try {
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);
      
      if (newLikedState) {
        await RecipeStorage.addLikedRecipe(recipe);
        Alert.alert('Added to liked recipes', 'Recipe saved to your liked recipes ❤️');
      } else {
        await RecipeStorage.removeLikedRecipe(recipe.id);
        Alert.alert('Removed from liked recipes', 'Recipe removed from your liked recipes 💔');
      }
    } catch (error) {
      console.error('Error updating like:', error);
      setIsLiked(!isLiked); // Revert state on error
      Alert.alert('Error', 'Failed to update like');
    }
  };

  const handleShare = () => {
    Alert.alert('Share Recipe', 'Recipe shared successfully!');
  };

  const handleFollow = () => {
    Alert.alert('Follow Chef', 'You are now following Chef Maria!');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'ingredients':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe.ingredients.map((ingredient: any, index: number) => (
              <View key={index} style={styles.ingredientItem}>
                <View style={styles.ingredientBullet} />
                <Text style={styles.ingredientText}>
                  {ingredient.name}
                  <Text style={styles.ingredientQuantity}> {ingredient.quantity}</Text>
                  {ingredient.essential && <Text style={styles.essentialTag}> (from your list)</Text>}
                </Text>
              </View>
            ))}
          </View>
        );
      
      case 'instructions':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <Text style={styles.stepsCounter}>0/{recipe.instructions.length} steps</Text>
            {recipe.instructions.map((step: any, index: number) => (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{step.step || index + 1}</Text>
                  </View>
                  <Text style={styles.stepTitle}>Step {step.step || index + 1}</Text>
                  <Text style={styles.stepTime}>{step.time}</Text>
                </View>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            ))}
          </View>
        );
      
      case 'nutrition':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Nutrition Facts</Text>
            <Text style={styles.nutritionSubtitle}>Per serving ({recipe.servings} servings total)</Text>
            {Object.entries(recipe.nutrition).map(([key, value]: [string, any]) => (
              <View key={key} style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                <Text style={styles.nutritionValue}>{value}</Text>
              </View>
            ))}
          </View>
        );
      
      case 'tips':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Cooking Tips</Text>
            {recipe.tips.map((tip: string, index: number) => (
              <View key={index} style={styles.tipItem}>
                <Text style={styles.tipIcon}>💡</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={handleLike} 
              onLongPress={() => router.push('/liked-recipes')}
              style={styles.headerButton}
            >
              <Text style={[styles.headerButtonText, isLiked && styles.likedButton]}>
                {isLiked ? '❤️' : '♡'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>↗</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleBookmark} 
              onLongPress={() => router.push('/bookmarked-recipes')}
              style={styles.headerButton}
            >
              <Text style={[styles.headerButtonText, isBookmarked && styles.bookmarkedButton]}>
                {isBookmarked ? '🔖' : '📑'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recipe Image and Info */}
        <View style={styles.recipeImageContainer}>
          <View style={styles.recipeImage}>
            <Text style={styles.recipeImagePlaceholder}>🍕</Text>
          </View>
          
          {/* Tags */}
          <View style={styles.tagsContainer}>
            {recipe.tags.map((tag: string, index: number) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag.toUpperCase()}</Text>
              </View>
            ))}
          </View>

          {/* Recipe Title and Rating */}
          <View style={styles.recipeInfo}>
            <Text style={styles.recipeTitle}>{recipe.title}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>⭐ {recipe.rating}</Text>
              <Text style={styles.ratingCount}>({recipe.ratingCount})</Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>🕒</Text>
            <Text style={styles.statLabel}>Total Time</Text>
            <Text style={styles.statValue}>{recipe.totalTime}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={styles.statLabel}>Servings</Text>
            <Text style={styles.statValue}>{recipe.servings}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statLabel}>Calories</Text>
            <Text style={styles.statValue}>{recipe.calories}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>⏱️</Text>
            <Text style={styles.statLabel}>Prep Time</Text>
            <Text style={styles.statValue}>{recipe.prepTime}</Text>
          </View>
        </View>

        {/* Chef Info */}
        <View style={styles.chefContainer}>
          <View style={styles.chefAvatar}>
            <Text style={styles.chefAvatarText}>👩‍🍳</Text>
          </View>
          <View style={styles.chefInfo}>
            <Text style={styles.chefName}>Chef Maria</Text>
            <Text style={styles.chefLabel}>Recipe by</Text>
          </View>
          <TouchableOpacity onPress={handleFollow} style={styles.followButton}>
            <Text style={styles.followButtonText}>Follow</Text>
          </TouchableOpacity>
        </View>

        {/* Recipe Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>{recipe.description}</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'ingredients' && styles.activeTab]}
            onPress={() => setActiveTab('ingredients')}
          >
            <Text style={[styles.tabText, activeTab === 'ingredients' && styles.activeTabText]}>
              🥘 Ingredients
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'instructions' && styles.activeTab]}
            onPress={() => setActiveTab('instructions')}
          >
            <Text style={[styles.tabText, activeTab === 'instructions' && styles.activeTabText]}>
              📋 Instructions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'nutrition' && styles.activeTab]}
            onPress={() => setActiveTab('nutrition')}
          >
            <Text style={[styles.tabText, activeTab === 'nutrition' && styles.activeTabText]}>
              📊 Nutrition
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tips' && styles.activeTab]}
            onPress={() => setActiveTab('tips')}
          >
            <Text style={[styles.tabText, activeTab === 'tips' && styles.activeTabText]}>
              💡 Tips
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8DDD4',
  },
  scrollView: {
    flex: 1,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#ED5565',
    marginTop: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerButtonText: {
    fontSize: 20,
    color: '#333',
  },
  likedButton: {
    color: '#ED5565',
  },
  bookmarkedButton: {
    color: '#ED5565',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  recipeImageContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeImage: {
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  recipeImagePlaceholder: {
    fontSize: 60,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  tag: {
    backgroundColor: '#666',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  tagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recipeInfo: {
    marginBottom: 10,
  },
  recipeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  ratingText: {
    fontSize: 16,
    color: '#333',
  },
  ratingCount: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    fontSize: 20,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  chefContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chefAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ED5565',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chefAvatarText: {
    fontSize: 24,
  },
  chefInfo: {
    flex: 1,
  },
  chefName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  chefLabel: {
    fontSize: 14,
    color: '#666',
  },
  followButton: {
    backgroundColor: '#ED5565',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  descriptionContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  descriptionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#ED5565',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: 'white',
  },
  tabContent: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  stepsCounter: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ED5565',
    marginRight: 12,
  },
  ingredientText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  ingredientQuantity: {
    fontWeight: 'bold',
  },
  stepItem: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ED5565',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  stepTime: {
    fontSize: 12,
    color: '#666',
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  nutritionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  nutritionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  nutritionLabel: {
    fontSize: 16,
    color: '#333',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  tipIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  essentialTag: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
}); 