import { Link, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getCurrentUser, signUpUser } from '../services/authService';

export default function SignupScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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

    const handleSignup = async () => {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        const result = await signUpUser(email, password);
        

        if (result.success) {
            Alert.alert('Success', 'Account created successfully!', [
                { text: 'OK', onPress: () => router.replace('/recipe-generator') }
            ]);
        } else {
            Alert.alert('Signup Failed', result.error);
        }
        setLoading(false);
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

            {/* Signup Form */}
            <View style={styles.formContainer}>
                <Text style={styles.title}>Create Account</Text>
                
                <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor="#999"
                />
                
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#999"
                />
                
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholderTextColor="#999"
                />
                
                <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    placeholderTextColor="#999"
                />
                
                <TouchableOpacity 
                    style={[styles.signupButton, loading && styles.signupButtonDisabled]}
                    onPress={handleSignup}
                    disabled={loading}
                >
                    <Text style={styles.signupButtonText}>
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </Text>
                </TouchableOpacity>
                
                {/* Login Link */}
                <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>Already have an account? </Text>
                    <Link href="/" style={styles.loginLink}>
                        <Text style={styles.loginLinkText}>Login</Text>
                    </Link>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E8DDD4',
    },
    logoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
    },
    logoPlaceholder: {
        alignItems: 'center',
    },
    logoImage: {
        width: 150,
        height: 150,
        marginBottom: 20,
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
    signupButton: {
        backgroundColor: '#ED5565',
        paddingVertical: 15,
        borderRadius: 8,
        marginTop: 10,
    },
    signupButtonDisabled: {
        backgroundColor: '#ccc',
    },
    signupButtonText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    loginText: {
        color: '#666',
        fontSize: 14,
    },
    loginLink: {
        marginLeft: 5,
    },
    loginLinkText: {
        color: '#ED5565',
        fontSize: 14,
        fontWeight: 'bold',
    },
}); 