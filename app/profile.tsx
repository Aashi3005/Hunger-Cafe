import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { getCurrentUser, signOutUser } from '../services/authService';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      } else {
        Alert.alert('Error', 'No user found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            await signOutUser();
            router.replace('/');
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ED5565" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleBack = () => {
    router.back();
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
            <Text style={styles.headerIcon}>👤</Text>
            <Text style={styles.headerTitle}>My Profile</Text>
            <Text style={styles.headerSubtitle}>Your account information</Text>
          </View>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>🍳</Text>
            </View>
            <Text style={styles.welcomeText}>Welcome, Chef!</Text>
          </View>

          {/* User Information */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>📧 Email Address</Text>
              <View style={styles.infoValueContainer}>
                <Text style={styles.infoValue}>{user?.email || 'No email available'}</Text>
                <Text style={styles.infoNote}>This email cannot be changed</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>👤 Display Name</Text>
              <View style={styles.infoValueContainer}>
                <Text style={styles.infoValue}>
                  {user?.displayName || user?.email?.split('@')[0] || 'Chef'}
                </Text>
                <Text style={styles.infoNote}>Default display name</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>🆔 User ID</Text>
              <View style={styles.infoValueContainer}>
                <Text style={[styles.infoValue, styles.userIdText]}>
                  {user?.uid ? `${user.uid.substring(0, 8)}...` : 'No ID'}
                </Text>
                <Text style={styles.infoNote}>Unique identifier</Text>
              </View>
            </View>

            {user?.createdAt && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>📅 Member Since</Text>
                <View style={styles.infoValueContainer}>
                  <Text style={styles.infoValue}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </Text>
                  <Text style={styles.infoNote}>Account creation date</Text>
                </View>
              </View>
            )}
          </View>

          {/* Account Actions */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Account Actions</Text>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/recipe-generator')}
            >
              <Text style={styles.actionButtonIcon}>🍽️</Text>
              <Text style={styles.actionButtonText}>Back to Recipe Generator</Text>
              <Text style={styles.actionButtonArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/liked-recipes')}
            >
              <Text style={styles.actionButtonIcon}>❤️</Text>
              <Text style={styles.actionButtonText}>My Liked Recipes</Text>
              <Text style={styles.actionButtonArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/bookmarked-recipes')}
            >
              <Text style={styles.actionButtonIcon}>🔖</Text>
              <Text style={styles.actionButtonText}>My Bookmarked Recipes</Text>
              <Text style={styles.actionButtonArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.logoutButton]}
              onPress={handleLogout}
            >
              <Text style={styles.actionButtonIcon}>🚪</Text>
              <Text style={[styles.actionButtonText, styles.logoutButtonText]}>Logout</Text>
              <Text style={styles.actionButtonArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfoCard}>
          <Text style={styles.appInfoTitle}>About HungerQuest</Text>
          <Text style={styles.appInfoText}>
            AI-powered recipe generator that helps you create delicious meals with your available ingredients.
          </Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
  headerButtonText: {
    fontSize: 20,
    color: '#333',
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
  profileCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ED5565',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 32,
    color: '#FFFFFF',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  infoSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ED5565',
    marginBottom: 15,
  },
  infoItem: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoValueContainer: {
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  infoNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  userIdText: {
    fontFamily: 'monospace',
    fontSize: 14,
  },
  actionsSection: {
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionButtonIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  actionButtonArrow: {
    fontSize: 16,
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FFCCCC',
  },
  logoutButtonText: {
    color: '#ED5565',
  },
  appInfoCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ED5565',
    marginBottom: 10,
  },
  appInfoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  appVersion: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
}); 