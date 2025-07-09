import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from './authService';


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

export class RecipeStorage {
  // Helper method to get user-specific keys
  private static async getUserSpecificKey(baseKey: string): Promise<string | null> {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser || !currentUser.uid) {
        console.error('No current user found');
        return null;
      }
      return `${baseKey}_${currentUser.uid}`;
    } catch (error) {
      console.error('Error getting user-specific key:', error);
      return null;
    }
  }

  // Liked Recipes Methods
  static async getLikedRecipes(): Promise<Recipe[]> {
    try {
      const userKey = await this.getUserSpecificKey('likedRecipes');
      if (!userKey) return [];
      
      const likedRecipes = await AsyncStorage.getItem(userKey);
      return likedRecipes ? JSON.parse(likedRecipes) : [];
    } catch (error) {
      console.error('Error getting liked recipes:', error);
      return [];
    }
  }

  static async addLikedRecipe(recipe: Recipe): Promise<void> {
    try {
      const userKey = await this.getUserSpecificKey('likedRecipes');
      if (!userKey) {
        console.error('Cannot add liked recipe: no user logged in');
        return;
      }
      
      const likedRecipes = await this.getLikedRecipes();
      const isAlreadyLiked = likedRecipes.some(r => r.id === recipe.id);
      
      if (!isAlreadyLiked) {
        likedRecipes.push(recipe);
        await AsyncStorage.setItem(userKey, JSON.stringify(likedRecipes));
      }
    } catch (error) {
      console.error('Error adding liked recipe:', error);
    }
  }

  static async removeLikedRecipe(recipeId: string): Promise<void> {
    try {
      const userKey = await this.getUserSpecificKey('likedRecipes');
      if (!userKey) {
        console.error('Cannot remove liked recipe: no user logged in');
        return;
      }
      
      const likedRecipes = await this.getLikedRecipes();
      const updatedRecipes = likedRecipes.filter(r => r.id !== recipeId);
      await AsyncStorage.setItem(userKey, JSON.stringify(updatedRecipes));
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
      const userKey = await this.getUserSpecificKey('bookmarkedRecipes');
      if (!userKey) return [];
      
      const bookmarkedRecipes = await AsyncStorage.getItem(userKey);
      return bookmarkedRecipes ? JSON.parse(bookmarkedRecipes) : [];
    } catch (error) {
      console.error('Error getting bookmarked recipes:', error);
      return [];
    }
  }

  static async addBookmarkedRecipe(recipe: Recipe): Promise<void> {
    try {
      const userKey = await this.getUserSpecificKey('bookmarkedRecipes');
      if (!userKey) {
        console.error('Cannot add bookmarked recipe: no user logged in');
        return;
      }
      
      const bookmarkedRecipes = await this.getBookmarkedRecipes();
      const isAlreadyBookmarked = bookmarkedRecipes.some(r => r.id === recipe.id);
      
      if (!isAlreadyBookmarked) {
        bookmarkedRecipes.push(recipe);
        await AsyncStorage.setItem(userKey, JSON.stringify(bookmarkedRecipes));
      }
    } catch (error) {
      console.error('Error adding bookmarked recipe:', error);
    }
  }

  static async removeBookmarkedRecipe(recipeId: string): Promise<void> {
    try {
      const userKey = await this.getUserSpecificKey('bookmarkedRecipes');
      if (!userKey) {
        console.error('Cannot remove bookmarked recipe: no user logged in');
        return;
      }
      
      const bookmarkedRecipes = await this.getBookmarkedRecipes();
      const updatedRecipes = bookmarkedRecipes.filter(r => r.id !== recipeId);
      await AsyncStorage.setItem(userKey, JSON.stringify(updatedRecipes));
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

  // Clear user-specific data (useful for testing or logout)
  static async clearUserData(): Promise<void> {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser || !currentUser.uid) {
        console.error('No current user found for clearing data');
        return;
      }
      
      const likedKey = `likedRecipes_${currentUser.uid}`;
      const bookmarkedKey = `bookmarkedRecipes_${currentUser.uid}`;
      
      await Promise.all([
        AsyncStorage.removeItem(likedKey),
        AsyncStorage.removeItem(bookmarkedKey)
      ]);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  // Clear all data (useful for testing) - this will clear data for all users
  static async clearAllData(): Promise<void> {
    try {
      // Get all keys from AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Filter keys that contain our recipe data
      const recipeKeys = allKeys.filter(key => 
        key.includes('likedRecipes_') || key.includes('bookmarkedRecipes_')
      );
      
      // Remove all recipe-related keys
      await AsyncStorage.multiRemove(recipeKeys);
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }
} 