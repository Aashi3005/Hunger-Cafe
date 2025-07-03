import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple local authentication service
const USERS_KEY = 'app_users';

// Get all users from storage
const getUsers = async () => {
  try {
    const users = await AsyncStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

// Save users to storage
const saveUsers = async (users) => {
  try {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Error saving users:', error);
  }
};

// Sign up function
export const signUpUser = async (email, password) => {
  try {
    const users = await getUsers();
    
    // Check if user already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return { success: false, error: 'User already exists with this email' };
    }
    
    // Create new user
    const newUser = {
      id: Date.now().toString(),
      email,
      password, // In real app, this should be hashed
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    await saveUsers(users);
    
    console.log('User created successfully:', newUser.id);
    return { success: true, user: { id: newUser.id, email: newUser.email } };
  } catch (error) {
    console.error('Sign up error:', error.message);
    return { success: false, error: error.message };
  }
};

// Sign in function
export const signInUser = async (email, password) => {
  try {
    const users = await getUsers();
    
    // Find user
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }
    
    // Save current user
    await AsyncStorage.setItem('current_user', JSON.stringify({ id: user.id, email: user.email }));
    
    console.log('User signed in successfully:', user.id);
    return { success: true, user: { id: user.id, email: user.email } };
  } catch (error) {
    console.error('Sign in error:', error.message);
    return { success: false, error: error.message };
  }
};

// Sign out function
export const signOutUser = async () => {
  try {
    await AsyncStorage.removeItem('current_user');
    console.log('User signed out successfully');
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error.message);
    return { success: false, error: error.message };
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const user = await AsyncStorage.getItem('current_user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};
