import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import FoodCard from '../components/FoodCard';
import foodData from '../constants/food-data.json';

const { width } = Dimensions.get('window');

interface FoodItem {
  id: string;
  name: string;
  image: string;
  isVeg: boolean;
  rating: string;
  originalPrice: string;
  discountedPrice: string;
}

export default function SnaccScreen() {
  const router = useRouter();
  const [isVegToggle, setIsVegToggle] = useState(false);
  const [showVegLoading, setShowVegLoading] = useState(false);
  const [filteredFoodItems, setFilteredFoodItems] = useState<FoodItem[]>([]);

  // Handle VEG toggle with loading screen
  const handleVegToggle = () => {
    setShowVegLoading(true);
    setIsVegToggle(!isVegToggle);
    
    // Auto-hide loading screen after 6 seconds
    setTimeout(() => {
      setShowVegLoading(false);
    }, 6000);
  };

  // Filter food items based on VEG toggle
  useEffect(() => {
    let allFoodItems = foodData.categories.flatMap(cat=> cat.items);
    if(isVegToggle){
      allFoodItems = allFoodItems.filter(item=>item.isVeg);
    }
    setFilteredFoodItems(allFoodItems);
  }, [isVegToggle]);

  const handleAddToCart = (itemId: string) => {
    console.log('Added to cart:', itemId);
    // Add your cart logic here
  };

  const handleCategoryPress = (categoryName: string) => {
    // Navigate to MenuScreen with category information
    router.push({
      pathname: '/menu-screen',
      params: {
        categoryName: categoryName,
        categoryId: categoryName.toLowerCase().replace(/\s+/g, '-')
      }
    });
  };

  const categories = [
    { name: 'Snacks', image: require('../assets/images/Snacks.png') },
    { name: 'K-pop Menu', image: require('../assets/images/K-pop menu.png') },
    { name: 'Hot Beverages', image: require('../assets/images/Hot beverages.png') },
    { name: 'Sweet Treats', image: require('../assets/images/Sweet treat.png') },
    { name: 'Newly Launched', image: require('../assets/images/Newly Launched.png') },
    { name: 'Maggi & Momos', image: require('../assets/images/Maggie and Momos.png') },
    { name: 'Items under ₹99', image: require('../assets/images/Items under 99.png') },
    { name: 'Healthy', image: require('../assets/images/Healthy.png') },
    { name: 'All Day Breakfast', image: require('../assets/images/All day breakfast.png') },
    { name: 'Coffee', image: require('../assets/images/Coffee.png') },
    { name: 'Sandwiches & Rolls', image: require('../assets/images/Sandwich and Rolls.png') },
    { name: 'Cold Beverages', image: require('../assets/images/Cold Beverages.png') },
    { name: 'Protein Corner', image: require('../assets/images/Protien Corner.png') },
    { name: 'Banger Dishes', image: require('../assets/images/Banger Dishes.png') },
    { name: 'Boba & Matcha', image: require('../assets/images/Boba and Matchas.png') },
    { name: 'The Whole Truth Specials', image: require('../assets/images/The whole truth special.png') }
  ];

  // Calculate grid width for horizontal scrolling
  const categoriesPerRow = 2;
  const totalRows = Math.ceil(categories.length / categoriesPerRow);
  const gridWidth = totalRows * 100; // 100px per row

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.locationContainer}>
          <View style={styles.deliveryBadge}>
            <Text style={styles.deliveryTime}>14 MINS</Text>
            <Text style={styles.locationText}>BTM Layout</Text>
            <Text style={styles.dropdown}>▼</Text>
          </View>
          <Text style={styles.address}>Industrial Area, BTM 2nd Stage, BTM Layout, B...</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.profileIcon}>
            <Text style={styles.profileIconText}>👤</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuIcon}>
            <Text style={styles.menuIconText}>⋯</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for 'Fruit Bowl'"
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.searchIcon}>
            <Text style={styles.searchIconText}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.micIcon}>
            <Text style={styles.micIconText}>🎙️</Text>
          </TouchableOpacity>
        </View>
        
        {/* VEG Toggle - Separate from search bar */}
        <View style={styles.vegToggleContainer}>
          <Text style={styles.vegLabel}>VEG</Text>
          <TouchableOpacity 
            style={[styles.vegToggle, isVegToggle && styles.vegToggleActive]}
            onPress={handleVegToggle}
          >
            <View style={[styles.vegToggleSlider, isVegToggle && styles.vegToggleSliderActive]} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* SNACC Brand Banner */}
        <View style={styles.brandBanner}>
          <View style={styles.brandContent}>
            <View style={styles.logoContainer}>
              <Text style={styles.snaccText}>SN</Text>
              <View style={styles.logoA}>
                <Text style={styles.logoAText}>A</Text>
              </View>
              <Text style={styles.snaccText}>CC</Text>
            </View>
            <Text style={styles.bySwiggy}>BY SWIGGY</Text>
          </View>
        </View>

        {/* Feature Highlights */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>👨‍🍳</Text>
            <Text style={styles.featureText}>Dishes by top rated chefs</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🛵</Text>
            <Text style={styles.featureText}>Free delivery above ₹99</Text>
          </View>
        </View>

        {/* Snacc O'Clock Section */}
        <View style={styles.snaccOClockContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Snacc O'Clock</Text>
            <Text style={styles.sectionIcon}>🍪</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.foodItemsScroll}>
            {filteredFoodItems.map((item) => (
              <FoodCard
                key={item.id}
                id={item.id}
                name={item.name}
                rating={item.rating}
                originalPrice={item.originalPrice}
                discountedPrice={item.discountedPrice}
                image={item.image}
                isVeg={item.isVeg}
                onAddToCart={() => handleAddToCart(item.id)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Referral Banner */}
        <View style={styles.referralBanner}>
          <View style={styles.referralContent}>
            <View style={styles.referralTextContainer}>
              <Text style={styles.referralTitle}>Refer and win a FREE SNACC worth ₹199*</Text>
              <Text style={styles.referralSubtitle}>Invite your gang now!</Text>
              <TouchableOpacity style={styles.referButton}>
                <Text style={styles.referButtonText}>Refer Now</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.characterContainer}>
              <Text style={styles.characterEmoji}>😎</Text>
              <Text style={styles.giftBox}>🎁</Text>
            </View>
          </View>
        </View>

        {/* What's on your mind Section */}
        <View style={styles.categoriesContainer}>
          <Text style={styles.categoriesTitle}>What's on your mind?</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesScrollContent}
          >
            <View style={[styles.categoriesGrid, { width: gridWidth }]}>
              {categories.map((category, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.categoryItem}
                  onPress={() => handleCategoryPress(category.name)}
                >
                  <View style={styles.categoryImageContainer}>
                    <Image source={category.image} style={styles.categoryImage} resizeMode="contain" />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* VEG Loading Popup */}
      {showVegLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingPopup}>
            <LottieView
              source={require('../assets/animations/tomato-plant.json')}
              autoPlay
              loop
              style={styles.loadingLottie}
            />
            <Text style={styles.loadingText}>Loading VEG Mode...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D7FC60', // Exact light green from screenshot
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: '#D7FC60',
  },
  locationContainer: {
    flex: 1,
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4019B4', // Exact purple from screenshot
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  deliveryTime: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 4,
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  dropdown: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  address: {
    fontSize: 12,
    color: '#666',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  menuIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIconText: {
    fontSize: 20,
    color: '#333',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchIconText: {
    fontSize: 18,
    color: '#666',
  },
  micIcon: {
    marginRight: 8,
  },
  micIconText: {
    fontSize: 18,
    color: '#8B5CF6',
  },
  vegToggleContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  vegLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  vegToggle: {
    width: 40,
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  vegToggleActive: {
    backgroundColor: '#4CAF50',
  },
  vegToggleSlider: {
    width: 16,
    height: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  vegToggleSliderActive: {
    alignSelf: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  brandBanner: {
    backgroundColor: '#D7FC60',
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  brandContent: {
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  snaccText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  logoA: {
    width: 40,
    height: 40,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  logoAText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bySwiggy: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureItem: {
    flex: 1,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  snaccOClockContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  sectionIcon: {
    fontSize: 20,
  },
  foodItemsScroll: {
    paddingLeft: 16,
  },
  referralBanner: {
    backgroundColor: '#4019B4', // Purple banner
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  referralContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  referralTextContainer: {
    flex: 1,
  },
  referralTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  referralSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  referButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  referButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  characterContainer: {
    alignItems: 'center',
  },
  characterEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  giftBox: {
    fontSize: 24,
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
    textAlign: 'left',
    paddingHorizontal: 16,
  },
  categoriesScroll: {
    paddingLeft: 16,
  },
  categoriesScrollContent: {
    paddingRight: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryItem: {
    alignItems: 'center',
    width: 80,
    marginRight: 20,
    marginBottom: 20,
  },
  categoryImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#D7FC60',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 3,
    borderColor: '#D7FC60', // Green border
    borderStyle: 'solid',
  },
  categoryImage: {
    width: 100,
    height: 100,
  },
  categoryName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingPopup: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#4019B4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingLottie: {
    width: 120,
    height: 120,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
});