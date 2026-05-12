const API_BASE_URL = 'https://68b80b9ab71540504326ddce.mockapi.io/api/dashboard/items';

export const menuService = {
  // Fetch all categories
  async getAllCategories() {
    try {
      const response = await fetch(`${API_BASE_URL}/category`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data[0]?.categories || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Fetch specific category by name or ID
  async getCategoryByName(categoryName) {
    try {
      const categories = await this.getAllCategories();
      const matchingCategory = categories.find(cat => 
        cat.name.toLowerCase().replace(/\s+/g, '-') === categoryName.toLowerCase().replace(/\s+/g, '-') ||
        cat.name.toLowerCase() === categoryName.toLowerCase()
      );
      return matchingCategory || null;
    } catch (error) {
      console.error('Error fetching category by name:', error);
      throw error;
    }
  },

  // Fetch specific category by ID
  async getCategoryById(categoryId) {
    try {
      const categories = await this.getAllCategories();
      const matchingCategory = categories.find(cat => cat.id === categoryId);
      return matchingCategory || null;
    } catch (error) {
      console.error('Error fetching category by ID:', error);
      throw error;
    }
  },

  // Search items across all categories
  async searchItems(query) {
    try {
      const categories = await this.getAllCategories();
      const allItems = categories.flatMap(cat => 
        cat.items.map(item => ({
          ...item,
          categoryName: cat.name,
          categoryId: cat.id
        }))
      );
      
      const filteredItems = allItems.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase())
      );
      
      return filteredItems;
    } catch (error) {
      console.error('Error searching items:', error);
      throw error;
    }
  }
};

export default menuService;
