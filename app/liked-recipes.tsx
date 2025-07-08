import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Recipe, RecipeStorage } from '../services/recipeStorage';

export default function LikedRecipesScreen() {
  const [likedRecipes, setLikedRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('All');
  const [selectedTag, setSelectedTag] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const loadLikedRecipes = async () => {
    try {
      const recipes = await RecipeStorage.getLikedRecipes();
      setLikedRecipes(recipes);
      setFilteredRecipes(recipes);
    } catch (error) {
      console.error('Error loading liked recipes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter recipes based on search query and filters
  useEffect(() => {
    let filtered = likedRecipes;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        recipe.ingredients.some(ingredient => 
          ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Apply cuisine filter
    if (selectedCuisine !== 'All') {
      filtered = filtered.filter(recipe =>
        recipe.tags.some(tag => tag.toLowerCase().includes(selectedCuisine.toLowerCase()))
      );
    }

    // Apply time filter
    if (selectedTimeFilter !== 'All') {
      filtered = filtered.filter(recipe => {
        const totalTime = parseInt(recipe.totalTime);
        switch (selectedTimeFilter) {
          case 'Quick (≤30 min)':
            return totalTime <= 30;
          case 'Medium (30-60 min)':
            return totalTime > 30 && totalTime <= 60;
          case 'Long (>60 min)':
            return totalTime > 60;
          default:
            return true;
        }
      });
    }

    // Apply tag filter
    if (selectedTag !== 'All') {
      filtered = filtered.filter(recipe =>
        recipe.tags.some(tag => tag.toLowerCase().includes(selectedTag.toLowerCase()))
      );
    }

    setFilteredRecipes(filtered);
  }, [likedRecipes, searchQuery, selectedCuisine, selectedTimeFilter, selectedTag]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLikedRecipes();
    setRefreshing(false);
  };

  useEffect(() => {
    loadLikedRecipes();
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleRecipePress = (recipe: Recipe) => {
    router.push({
      pathname: '/recipe-detail',
      params: { recipe: JSON.stringify(recipe) }
    });
  };

  const handleRemoveLiked = async (recipeId: string) => {
    try {
      await RecipeStorage.removeLikedRecipe(recipeId);
      setLikedRecipes(prev => prev.filter(r => r.id !== recipeId));
      Alert.alert('Success', 'Recipe removed from liked recipes');
    } catch (error) {
      console.error('Error removing liked recipe:', error);
      Alert.alert('Error', 'Failed to remove recipe from liked recipes');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCuisine('All');
    setSelectedTimeFilter('All');
    setSelectedTag('All');
  };

  const getUniqueValues = (key: string) => {
    const values = new Set<string>();
    likedRecipes.forEach(recipe => {
      if (key === 'tags') {
        recipe.tags.forEach(tag => values.add(tag));
      }
    });
    return Array.from(values).sort();
  };

  const cuisineOptions = ['All', 'Indian', 'Italian', 'Asian', 'Mexican', 'Mediterranean', 'American'];
  const timeOptions = ['All', 'Quick (≤30 min)', 'Medium (30-60 min)', 'Long (>60 min)'];
  const tagOptions = ['All', ...getUniqueValues('tags')];

  const renderFilterButton = (
    options: string[],
    selectedValue: string,
    onSelect: (value: string) => void,
    title: string
  ) => (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.filterOption,
              selectedValue === option && styles.filterOptionSelected
            ]}
            onPress={() => onSelect(option)}
          >
            <Text style={[
              styles.filterOptionText,
              selectedValue === option && styles.filterOptionTextSelected
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSearchAndFilters = () => (
    <View style={styles.searchFilterContainer}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes, ingredients, or tags..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#666"
        />
        <TouchableOpacity
          style={styles.filterToggleButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterToggleIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          {renderFilterButton(cuisineOptions, selectedCuisine, setSelectedCuisine, 'Cuisine')}
          {renderFilterButton(timeOptions, selectedTimeFilter, setSelectedTimeFilter, 'Cooking Time')}
          {renderFilterButton(tagOptions, selectedTag, setSelectedTag, 'Tags')}
          
          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Clear All Filters</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderRecipeCard = (recipe: Recipe) => (
    <View key={recipe.id} style={styles.recipeCard}>
      <TouchableOpacity
        style={styles.recipeContent}
        onPress={() => handleRecipePress(recipe)}
      >
        <View style={styles.recipeImage}>
          <Text style={styles.recipeImagePlaceholder}>🍕</Text>
        </View>
        
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeTitle}>{recipe.title}</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>⭐ {recipe.rating}</Text>
            <Text style={styles.ratingCount}>({recipe.ratingCount})</Text>
          </View>
          
          <View style={styles.recipeStats}>
            <Text style={styles.statText}>⏱️ {recipe.totalTime}</Text>
            <Text style={styles.statText}>👥 {recipe.servings}</Text>
            <Text style={styles.statText}>🔥 {recipe.calories}</Text>
          </View>
          
          <View style={styles.tagsContainer}>
            {recipe.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveLiked(recipe.id)}
      >
        <Text style={styles.removeButtonText}>💔</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💔</Text>
      <Text style={styles.emptyTitle}>
        {searchQuery || selectedCuisine !== 'All' || selectedTimeFilter !== 'All' || selectedTag !== 'All'
          ? 'No recipes match your search'
          : 'No Liked Recipes Yet'}
      </Text>
      <Text style={styles.emptyDescription}>
        {searchQuery || selectedCuisine !== 'All' || selectedTimeFilter !== 'All' || selectedTag !== 'All'
          ? 'Try adjusting your search terms or filters'
          : 'Start liking recipes to see them here. Your favorite recipes will be saved for easy access!'}
      </Text>
      {!(searchQuery || selectedCuisine !== 'All' || selectedTimeFilter !== 'All' || selectedTag !== 'All') && (
        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => router.push('/recipe-generator')}
        >
          <Text style={styles.exploreButtonText}>Explore Recipes</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Liked Recipes</Text>
        <View style={styles.headerRight}>
          <Text style={styles.recipeCount}>{filteredRecipes.length}</Text>
        </View>
      </View>

      {/* Search and Filters */}
      {renderSearchAndFilters()}

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading liked recipes...</Text>
          </View>
        ) : filteredRecipes.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.recipesContainer}>
            {filteredRecipes.map(renderRecipeCard)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8DDD4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
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
    fontSize: 20,
    color: '#333',
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
    alignItems: 'center',
  },
  recipeCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ED5565',
  },
  searchFilterContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
  },
  filterToggleButton: {
    marginLeft: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ED5565',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterToggleIcon: {
    fontSize: 18,
    color: 'white',
  },
  filtersContainer: {
    marginTop: 10,
  },
  filterSection: {
    marginBottom: 15,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  filterScrollView: {
    flexDirection: 'row',
  },
  filterOption: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  filterOptionSelected: {
    backgroundColor: '#ED5565',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterOptionTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  clearFiltersButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  clearFiltersText: {
    color: '#ED5565',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  recipesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  recipeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeContent: {
    flexDirection: 'row',
    padding: 15,
  },
  recipeImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  recipeImagePlaceholder: {
    fontSize: 32,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#333',
    marginRight: 5,
  },
  ratingCount: {
    fontSize: 12,
    color: '#666',
  },
  recipeStats: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  tag: {
    backgroundColor: '#666',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 3,
  },
  tagText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  removeButtonText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  exploreButton: {
    backgroundColor: '#ED5565',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 