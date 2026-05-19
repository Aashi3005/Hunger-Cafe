import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import menuService from '../services/menuService';

const { width } = Dimensions.get('window');

interface MenuItem {
  id: string;
  name: string;
  price: number;
  isVeg: boolean;
  image: string;
}

interface Category {
  id: string;
  name: string;
  image: string;
  items: MenuItem[];
}

export default function MenuScreen() {
  const router = useRouter();
  const { categoryName, categoryId } = useLocalSearchParams<{ categoryName: string; categoryId: string }>();
  
  const [categoryData, setCategoryData] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategoryData();
  }, [categoryName]);

  const fetchCategoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const category = await menuService.getCategoryByName(categoryName);
      
      if (category) {
        setCategoryData(category);
      } else {
        setError('Category not found');
      }
    } catch (err) {
      console.error('Error fetching category data:', err);
      setError('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (itemId: string) => {
    console.log('Added to cart:', itemId);
    Alert.alert('Added to Cart', 'Item added to cart successfully!');
  };

  const handleBackPress = () => {
    router.back();
  };

  const renderMenuItem = (item: MenuItem) => (
    <View key={item.id} style={styles.menuItem}>
      <View style={styles.menuItemImageContainer}>
        <Image 
          source={{ uri: item.image }} 
          style={styles.menuItemImage}
          resizeMode="cover"
        />
        <View style={styles.brandLogo}>
          <Text style={styles.brandLogoText}>SNACC</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => handleAddToCart(item.id)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.menuItemInfo}>
        <View style={styles.menuItemHeader}>
          <View style={styles.vegIndicator}>
            <Text style={[styles.vegIndicatorText, { color: item.isVeg ? '#4ADE80' : '#FF4444' }]}>
              {item.isVeg ? '●' : '▲'}
            </Text>
          </View>
          <Text style={styles.menuItemName}>{item.name}</Text>
        </View>
        
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingText}>⭐ 4.2 (25)</Text>
        </View>
        
        <Text style={styles.menuItemDescription}>
          {item.isVeg ? 'Healthy. Protein & crunch packed.' : 'Delicious and nutritious meal.'}
        </Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.menuItemPrice}>₹{item.price}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4019B4" />
          <Text style={styles.loadingText}>Loading menu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCategoryData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Purple Background */}
      <View style={styles.header}>
        <View style={styles.headerDots} />
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryName?.toUpperCase()}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.searchButton}>
            <Text style={styles.searchButtonText}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Image in Header */}
      {categoryData && (
        <View style={styles.categoryImageContainer}>
          <Image 
            source={{ uri: categoryData.image }} 
            style={styles.categoryImage}
            resizeMode="cover"
          />
          <View style={styles.categoryImageRing} />
        </View>
      )}

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Dish Count */}
        <Text style={styles.dishCount}>
          {categoryData?.items.length || 0} Dishes
        </Text>

        {/* Menu Items Grid */}
        <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.menuGrid}>
            {categoryData?.items.map(renderMenuItem)}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D7FC60',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D7FC60',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4019B4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#6B46C1',
    position: 'relative',
  },
  headerDots: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#6B46C1',
    opacity: 0.1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: '#4ADE80',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  categoryImageContainer: {
    position: 'absolute',
    right: 20,
    top: 60,
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryImageRing: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#4ADE80',
    borderStyle: 'dashed',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  dishCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  menuContainer: {
    flex: 1,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: (width - 48) / 2,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  menuItemImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  menuItemImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  brandLogo: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  brandLogoText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
  },
  addButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#4ADE80',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuItemInfo: {
    paddingHorizontal: 4,
  },
  menuItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vegIndicator: {
    marginRight: 6,
  },
  vegIndicatorText: {
    fontSize: 12,
  },
  menuItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    flex: 1,
    lineHeight: 18,
  },
  ratingContainer: {
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#666666',
  },
  menuItemDescription: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
});
