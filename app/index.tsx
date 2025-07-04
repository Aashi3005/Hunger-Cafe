import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getCurrentUser, signInUser } from '../services/authService';

export default function AuthScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        const currentUser = await getCurrentUser();
        if (currentUser) {
            // User is already logged in, redirect to recipe generator
            router.replace('/recipe-generator');
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        const result = await signInUser(email, password);
        setLoading(false);

        if (result.success) {
            // Navigate to recipe generator screen after successful login
            router.replace('/recipe-generator');
        } else {
            Alert.alert('Login Failed', result.error);
        }
    };

    return (
        <View style={styles.container}>
            {/* Logo Section */}
            <View style={styles.logoContainer}>
                <View style={styles.logoPlaceholder}>
                    <Image
                        source={require('@/assets/images/app-logo1.png')}
                        style={styles.logoImage}
                    />
                    <Text style={styles.appName}>HungerQuest</Text>
                </View>
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
                <Text style={styles.title}>Welcome Back</Text>

                <TextInput
                    style={styles.input}
                    placeholder='Email'
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize='none'
                    placeholderTextColor='#999'
                />

                <TextInput
                    style={styles.input}
                    placeholder='Password'
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholderTextColor='#999'
                />

                <TouchableOpacity 
                    style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
                    onPress={handleLogin}
                    disabled={loading}
                >
                    <Text style={styles.loginButtonText}>
                        {loading ? 'Logging in...' : 'Login'}
                    </Text>
                </TouchableOpacity>

                {/* signup link */}
                <View style={styles.signupContainer}>
                    <Text style={styles.signupText}>Don't have an account?</Text>
                    <Link href="/signup" style={styles.signupLink}>
                        <Text style={styles.signupLinkText}>SignUp</Text>
                    </Link>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container :{
        flex: 1,
        backgroundColor: '#E8DDD4'
    },
    logoContainer : {
        flex:1 ,
        justifyContent: 'center',
        alignItems: 'center',
    paddingTop: 60,
  },
  logoPlaceholder: {
    alignItems: 'center',
  },
  logoImage:{
    height: 350,
    marginBottom: -90,
    resizeMode: 'contain',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ED5565',
  },
  formContainer: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#ED5565',
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  loginButton: {
    backgroundColor: '#ED5565',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupText: {
    color: '#666',
    fontSize: 14,
  },
  signupLink: {
    marginLeft: 5,
  },
  signupLinkText: {
    color: '#ED5565',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
