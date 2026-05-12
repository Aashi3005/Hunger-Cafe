import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function CafeLoadingScreen() {
  const titleScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Title pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(titleScale, {
          toValue: 1.06,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(titleScale, {
          toValue: 1.0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Auto-navigate to cafe mode after 3 seconds
    const timer = setTimeout(() => {
      // Here you can navigate to your actual cafe delivery app
      Alert.alert('Cafe Mode', 'Welcome to Hunger Cafe! Your cafe delivery app is ready.');
      router.back(); // Go back to recipe generator for now
    }, 1800000);

    return () => clearTimeout(timer);
  }, []);

  const handleSkip = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Background gradient effect */}
      <View style={styles.gradientBackground} />
      
      {/* Main content */}
      <View style={styles.contentContainer}>
        {/* Loader animation inside circular plate */}
        <View style={styles.foodImageContainer}>
          <LottieView
            source={require('../assets/animations/food-squeeze-burger-animation.json')}
            autoPlay
            loop
            style={styles.lottie}
          />
        </View>
        
        {/* App title */}
        <Animated.Text style={[styles.appTitle, { transform: [{ scale: titleScale }] }]}>
          HUNGER CAFE
        </Animated.Text>
        
        {/* Subtitle */}
        <Text style={styles.subtitle}>Fast delivery at your doorstep</Text>
        
        {/* Description */}
        <Text style={styles.description}>
          Home delivery and online reservation system for restaurants & cafe
        </Text>
        
        {/* Action button */}
        <TouchableOpacity 
          style={styles.exploreButton} 
          onPress={() => router.push('/snacc-screen')}
        >
          <Text style={styles.exploreButtonText}>Let's Explore</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2E7D32', // Dark green background like SNACC
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#2E7D32',
    // You can add gradient here if needed
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  foodImageContainer: {
    width: 500,
    height: 300,
    borderRadius: 100,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden', // This ensures the image stays within the circular boundary
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 60,
    lineHeight: 20,
    opacity: 0.9,
  },
  exploreButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  exploreButtonText: {
    color: '#2E7D32',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
