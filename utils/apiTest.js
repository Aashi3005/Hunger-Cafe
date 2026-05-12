// Simple API test utility
const testAPI = async () => {
  try {
    console.log('Testing API endpoint...');
    const response = await fetch('https://68b80b9ab71540504326ddce.mockapi.io/api/dashboard/items');
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('API Response Data:', data);
      console.log('Number of items:', data.length);
      
      // Show unique categories
      const categories = [...new Set(data.map(item => item.category))];
      console.log('Available categories:', categories);
    } else {
      console.log('API Error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Network Error:', error);
  }
};

// Export for use in React Native
export default testAPI;

