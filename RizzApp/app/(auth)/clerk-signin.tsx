import { useAuth, useSignIn } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { getSupabaseUserFromClerk, syncClerkUserToSupabase } from '../../api/authApi';

export default function ClerkSignInScreen() {
    const { signIn, setActive, isLoaded } = useSignIn();
    const { getToken } = useAuth(); // Get getToken to retrieve session info
    const router = useRouter();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSignIn = async () => {
        if (!isLoaded) return;

        // Validation
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }
        if (!password) {
            Alert.alert('Error', 'Please enter your password');
            return;
        }

        setLoading(true);
        try {
            // Step 1: Create sign-in attempt with Clerk
            const completeSignIn = await signIn.create({
                identifier: email,
                password,
            });

            // Step 2: Set the session as active
            await setActive({ session: completeSignIn.createdSessionId });
            console.log('✅ Clerk session active');

            // Step 3: Get Clerk user ID from the JWT token
            // After setActive, we can get the token which contains the userId
            const token = await getToken();
            
            if (!token) {
                console.error('❌ Failed to get token from Clerk session');
                throw new Error('Failed to get authentication token');
            }
            
            // Decode JWT to get userId (JWT format: header.payload.signature)
            // We need the payload which is the middle part
            const payload = token.split('.')[1];
            const decodedPayload = JSON.parse(atob(payload));
            const currentUserId = decodedPayload.sub; // 'sub' contains the user ID in JWT
            
            if (!currentUserId) {
                console.error('❌ Failed to extract userId from token');
                throw new Error('Failed to get Clerk user ID from token');
            }
            
            console.log('🔑 Clerk User ID:', currentUserId);

            // Step 4: Sync to Supabase + AsyncStorage
            try {
                // Get user from Supabase using Clerk ID
                let supabaseUser = await getSupabaseUserFromClerk(currentUserId);
                
                // If user doesn't exist in Supabase, create them
                if (!supabaseUser) {
                    console.log('📝 User not found in Supabase, creating...');
                    // Get email from the sign-in object
                    const userEmail = completeSignIn.identifier || email;
                    // Use email as full name if we don't have it (user can update later)
                    const userFullName = userEmail.split('@')[0];
                    
                    supabaseUser = await syncClerkUserToSupabase(currentUserId, userEmail, userFullName);
                    console.log('✅ Clerk user created in Supabase');
                }
                
                if (supabaseUser) {
                    // Store in AsyncStorage for getCurrentUser()
                    await AsyncStorage.setItem('@rizzapp_user', JSON.stringify(supabaseUser));
                    await AsyncStorage.setItem('@rizzapp_token', supabaseUser.id);
                    console.log('✅ Clerk user stored in AsyncStorage');
                    console.log('✅ User data:', { id: supabaseUser.id, email: supabaseUser.email, clerk_user_id: supabaseUser.clerk_user_id });
                } else {
                    throw new Error('Failed to get or create Supabase user');
                }
            } catch (syncError) {
                console.error('❌ CRITICAL: Failed to sync user data:', syncError);
                Alert.alert('Sync Error', 'Failed to sync your account data. Please try signing in again.');
                throw syncError; // Block sign-in if sync fails
            }

            // Step 5: Navigate to home screen
            console.log('✅ Clerk Sign-In Successful!');
            router.replace('/(tabs)/home');
        } catch (err: any) {
            console.error('❌ Clerk Sign-In Error:', JSON.stringify(err, null, 2));
            Alert.alert(
                'Sign In Failed',
                err.errors?.[0]?.message || 'Invalid email or password. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header with Gradient */}
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <MaterialCommunityIcons name="shield-lock" size={60} color="#fff" />
                <Text style={styles.headerTitle}>Sign In</Text>
                <Text style={styles.headerSubtitle}>Welcome back to RizzApp</Text>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="email" size={20} color="#999" />
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Enter your email"
                                placeholderTextColor="#999"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                            />
                        </View>
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="lock" size={20} color="#999" />
                            <TextInput
                                style={styles.input}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Enter your password"
                                placeholderTextColor="#999"
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <MaterialCommunityIcons
                                    name={showPassword ? 'eye-off' : 'eye'}
                                    size={20}
                                    color="#999"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Sign In Button */}
                    <TouchableOpacity
                        style={styles.signInButton}
                        onPress={handleSignIn}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={['#667eea', '#764ba2']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.signInGradient}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="login" size={20} color="#fff" />
                                    <Text style={styles.signInText}>Sign In</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Go to Sign Up */}
                    <TouchableOpacity
                        style={styles.switchButton}
                        onPress={() => router.push('/(auth)/clerk-signup')}
                    >
                        <Text style={styles.switchText}>
                            Don&apos;t have an account?{' '}
                            <Text style={styles.switchTextBold}>Sign Up</Text>
                        </Text>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Team Member Login */}
                    <TouchableOpacity
                        style={styles.regularLoginButton}
                        onPress={() => router.push('/(auth)/team-login')}
                    >
                        <MaterialCommunityIcons name="account-group" size={20} color="#667eea" />
                        <Text style={styles.regularLoginText}>Team Member Login</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 16,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 40,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        gap: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 15,
        color: '#333',
    },
    signInButton: {
        marginTop: 10,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    signInGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    signInText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    switchButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    switchText: {
        fontSize: 14,
        color: '#666',
    },
    switchTextBold: {
        fontWeight: '600',
        color: '#667eea',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 30,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e0e0e0',
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 12,
        color: '#999',
        fontWeight: '600',
    },
    regularLoginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#667eea',
        gap: 8,
    },
    regularLoginText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#667eea',
    },
});
