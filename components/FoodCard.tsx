import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FoodCardProps {
  id: string;
  name: string;
  rating: string;
  originalPrice: string;
  discountedPrice: string;
  image: string;
  isVeg: boolean;
  onAddToCart?: () => void;
}

export default function FoodCard({
  id,
  name,
  rating,
  originalPrice,
  discountedPrice,
  image,
  isVeg,
  onAddToCart
}: FoodCardProps) {
  return (
    <View style={styles.foodItemCard}>
      <View style={styles.foodItemImage}>
        <Text style={styles.foodEmoji}>{image}</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddToCart}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.foodItemInfo}>
        <View style={styles.nameContainer}>
          <View style={[styles.vegIndicator, { backgroundColor: isVeg ? '#4CAF50' : '#FF5722' }]} />
          <Text style={styles.foodItemName}>{name}</Text>
        </View>
        
        <Text style={styles.foodItemRating}>⭐ {rating}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.originalPrice}>{originalPrice}</Text>
          <View style={styles.discountedPriceBox}>
            <Text style={styles.discountedPrice}>{discountedPrice}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  foodItemCard: {
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginRight: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  foodItemImage: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 8,
  },
  foodEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  foodItemInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vegIndicator: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 6,
  },
  foodItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  foodItemRating: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountedPriceBox: {
    backgroundColor: '#FFD700', // Yellow box for discounted price
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountedPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
});
