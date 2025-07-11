import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function RecipeSuggestionsScreen() {
  const params = useLocalSearchParams();
  
  // Parse the recipes data from params
  let recipes = [];
  try {
    recipes = JSON.parse(params.recipes as string);
  } catch (error) {
    console.error('Error parsing recipes:', error);
    Alert.alert('Error', 'Failed to load recipe suggestions');
    router.back();
    return null;
  }

  const handleRecipeSelect = (recipe: any) => {
    router.push({
      pathname: '/recipe-detail',
      params: {
        recipe: JSON.stringify(recipe)
      }
    });
  };

  const handleBack = () => {
    router.back();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
      case 'hard':
        return '#F44336';
      default:
        return '#666';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerIcon}>🍽️</Text>
            <Text style={styles.headerTitle}>Recipe Suggestions</Text>
            <Text style={styles.headerSubtitle}>Choose your perfect recipe!</Text>
          </View>
        </View>

        {/* Recipe Cards */}
        <View style={styles.recipesContainer}>
          {recipes.map((recipe, index) => (
            <TouchableOpacity
              key={recipe.id || index}
              style={styles.recipeCard}
              onPress={() => handleRecipeSelect(recipe)}
              activeOpacity={0.7}
            >
              <View style={styles.recipeHeader}>
                <View style={styles.recipeHeaderLeft}>
                  <Text style={styles.recipeTitle}>{recipe.recipeName || recipe.title}</Text>
                  <Text style={styles.recipeDescription}>{recipe.description}</Text>
                </View>
                <View style={styles.recipeHeaderRight}>
                  <View style={styles.ratingContainer}>
                    <Text style={styles.ratingIcon}>⭐</Text>
                    <Text style={styles.ratingText}>{recipe.rating}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.recipeInfo}>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoIcon}>⏱️</Text>
                    <Text style={styles.infoText}>{recipe.totalTime}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoIcon}>👥</Text>
                    <Text style={styles.infoText}>{recipe.servings}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoIcon}>🔥</Text>
                    <Text style={styles.infoText}>{recipe.calories} cal</Text>
                  </View>
                </View>
                
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoIcon}>🌍</Text>
                    <Text style={styles.infoText}>{recipe.cuisine}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(recipe.difficulty) }]}>
                      {recipe.difficulty}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Tags */}
              {recipe.tags && recipe.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {recipe.tags.slice(0, 3).map((tag, tagIndex) => (
                    <View key={tagIndex} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                  {recipe.tags.length > 3 && (
                    <Text style={styles.moreTagsText}>+{recipe.tags.length - 3} more</Text>
                  )}
                </View>
              )}

              {/* Key Ingredients Preview */}
              <View style={styles.ingredientsPreview}>
                <Text style={styles.ingredientsTitle}>Key Ingredients:</Text>
                <Text style={styles.ingredientsText}>
                  {recipe.ingredients
                    ?.filter(ing => ing.essential)
                    .slice(0, 4)
                    .map(ing => ing.name)
                    .join(', ')
                  }
                  {recipe.ingredients?.filter(ing => ing.essential).length > 4 && '...'}
                </Text>
              </View>

              {/* Call to Action */}
              <View style={styles.ctaContainer}>
                <Text style={styles.ctaText}>Tap to view full recipe →</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Found {recipes.length} amazing recipes for you! 🎉
          </Text>
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
  backButtonText: {
    fontSize: 16,
    color: '#ED5565',
    fontWeight: '600',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ED5565',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  recipesContainer: {
    paddingHorizontal: 20,
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  recipeHeaderLeft: {
    flex: 1,
    marginRight: 15,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  recipeDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  recipeHeaderRight: {
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57C00',
  },
  recipeInfo: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    minWidth: 60,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 15,
  },
  tag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  ingredientsPreview: {
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  ingredientsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  ingredientsText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  ctaContainer: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  ctaText: {
    fontSize: 14,
    color: '#ED5565',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
}); 