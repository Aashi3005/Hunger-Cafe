import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Recipe {
  id: string;
  title: string;
  rating: number;
  ratingCount: number;
  totalTime: string;
  servings: number;
  calories: number;
  prepTime: string;
  tags: string[];
  ingredients: Array<{
    name: string;
    quantity: string;
    essential?: boolean;
  }>;
  instructions: Array<{
    step: number;
    description: string;
    time: string;
  }>;
  nutrition: {
    [key: string]: string;
  };
  tips: string[];
  description: string;
}

const LIKED_RECIPES_KEY = 'likedRecipes';
const BOOKMARKED_RECIPES_KEY = 'bookmarkedRecipes';

export class RecipeStorage {
  // Liked Recipes Methods
  static async getLikedRecipes(): Promise<Recipe[]> {
    try {
      const likedRecipes = await AsyncStorage.getItem(LIKED_RECIPES_KEY);
      return likedRecipes ? JSON.parse(likedRecipes) : [];
    } catch (error) {
      console.error('Error getting liked recipes:', error);
      return [];
    }
  }

  static async addLikedRecipe(recipe: Recipe): Promise<void> {
    try {
      const likedRecipes = await this.getLikedRecipes();
      const isAlreadyLiked = likedRecipes.some(r => r.id === recipe.id);
      
      if (!isAlreadyLiked) {
        likedRecipes.push(recipe);
        await AsyncStorage.setItem(LIKED_RECIPES_KEY, JSON.stringify(likedRecipes));
      }
    } catch (error) {
      console.error('Error adding liked recipe:', error);
    }
  }

  static async removeLikedRecipe(recipeId: string): Promise<void> {
    try {
      const likedRecipes = await this.getLikedRecipes();
      const updatedRecipes = likedRecipes.filter(r => r.id !== recipeId);
      await AsyncStorage.setItem(LIKED_RECIPES_KEY, JSON.stringify(updatedRecipes));
    } catch (error) {
      console.error('Error removing liked recipe:', error);
    }
  }

  static async isRecipeLiked(recipeId: string): Promise<boolean> {
    try {
      const likedRecipes = await this.getLikedRecipes();
      return likedRecipes.some(r => r.id === recipeId);
    } catch (error) {
      console.error('Error checking if recipe is liked:', error);
      return false;
    }
  }

  // Bookmarked Recipes Methods
  static async getBookmarkedRecipes(): Promise<Recipe[]> {
    try {
      const bookmarkedRecipes = await AsyncStorage.getItem(BOOKMARKED_RECIPES_KEY);
      return bookmarkedRecipes ? JSON.parse(bookmarkedRecipes) : [];
    } catch (error) {
      console.error('Error getting bookmarked recipes:', error);
      return [];
    }
  }

  static async addBookmarkedRecipe(recipe: Recipe): Promise<void> {
    try {
      const bookmarkedRecipes = await this.getBookmarkedRecipes();
      const isAlreadyBookmarked = bookmarkedRecipes.some(r => r.id === recipe.id);
      
      if (!isAlreadyBookmarked) {
        bookmarkedRecipes.push(recipe);
        await AsyncStorage.setItem(BOOKMARKED_RECIPES_KEY, JSON.stringify(bookmarkedRecipes));
      }
    } catch (error) {
      console.error('Error adding bookmarked recipe:', error);
    }
  }

  static async removeBookmarkedRecipe(recipeId: string): Promise<void> {
    try {
      const bookmarkedRecipes = await this.getBookmarkedRecipes();
      const updatedRecipes = bookmarkedRecipes.filter(r => r.id !== recipeId);
      await AsyncStorage.setItem(BOOKMARKED_RECIPES_KEY, JSON.stringify(updatedRecipes));
    } catch (error) {
      console.error('Error removing bookmarked recipe:', error);
    }
  }

  static async isRecipeBookmarked(recipeId: string): Promise<boolean> {
    try {
      const bookmarkedRecipes = await this.getBookmarkedRecipes();
      return bookmarkedRecipes.some(r => r.id === recipeId);
    } catch (error) {
      console.error('Error checking if recipe is bookmarked:', error);
      return false;
    }
  }

  // Clear all data (useful for testing)
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(LIKED_RECIPES_KEY);
      await AsyncStorage.removeItem(BOOKMARKED_RECIPES_KEY);
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }
} 