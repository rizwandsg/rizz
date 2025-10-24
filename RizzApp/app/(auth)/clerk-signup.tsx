import { useSignUp } from '@clerk/clerk-expo';
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
import { syncClerkUserToSupabase } from '../../api/authApi';

export default function ClerkSignUpScreen() {
    const { isLoaded, signUp, setActive } = useSignUp();
    const router = useRouter();
    
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState('');

    const handleSignUp = async () => {
        if (!isLoaded) return;

        // Validation
        if (!fullName.trim()) {
            Alert.alert('Error', 'Please enter your full name');
            return;
        }
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }
        if (!password || password.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        try {
            // Step 1: Create the user in Clerk
            const nameParts = fullName.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || '';

            await signUp.create({
                emailAddress: email,
                password,
                firstName,
                lastName,
            });

            // Step 2: Send email verification code
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

            // Step 3: Show verification screen
            setPendingVerification(true);
            Alert.alert('Verification Code Sent', 'Check your email for the verification code');
        } catch (err: any) {
            console.error('❌ Clerk Sign-Up Error:', JSON.stringify(err, null, 2));
            Alert.alert(
                'Sign Up Failed',
                err.errors?.[0]?.message || 'Unable to create account. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!isLoaded) return;

        if (!code || code.length !== 6) {
            Alert.alert('Error', 'Please enter the 6-digit verification code');
            return;
        }

        setLoading(true);
        try {
            // Step 1: Verify the email with the code
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code,
            });

            // Step 2: Set the session as active
            await setActive({ session: completeSignUp.createdSessionId });

            // Step 3: Sync Clerk user to Supabase and store in AsyncStorage
            try {
                const clerkUserId = completeSignUp.createdUserId;
                const supabaseUser = await syncClerkUserToSupabase(clerkUserId!, email.trim(), fullName.trim());
                console.log('✅ Clerk user synced to Supabase successfully');
                
                // Store user in AsyncStorage for getCurrentUser()
                await AsyncStorage.setItem('@rizzapp_user', JSON.stringify(supabaseUser));
                await AsyncStorage.setItem('@rizzapp_token', supabaseUser.id);
                console.log('✅ Clerk user stored in AsyncStorage');
            } catch (syncError) {
                console.error('⚠️ Failed to sync to Supabase (non-blocking):', syncError);
                // Don't block signup if Supabase sync fails
            }

            // Step 4: Navigate to home
            console.log('✅ Clerk Sign-Up & Verification Successful!');
            Alert.alert('Success!', 'Your account has been created', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/home') }
            ]);
        } catch (err: any) {
            console.error('❌ Verification Error:', JSON.stringify(err, null, 2));
            Alert.alert(
                'Verification Failed',
                err.errors?.[0]?.message || 'Invalid code. Please try again.'
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
                <MaterialCommunityIcons 
                    name={pendingVerification ? "email-check" : "account-plus"} 
                    size={60} 
                    color="#fff" 
                />
                <Text style={styles.headerTitle}>
                    {pendingVerification ? 'Verify Email' : 'Create Account'}
                </Text>
                <Text style={styles.headerSubtitle}>
                    {pendingVerification ? 'Enter the code sent to your email' : 'Sign up to get started'}
                </Text>
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
                    {!pendingVerification ? (
                        <>
                            {/* Full Name Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Full Name</Text>
                                <View style={styles.inputContainer}>
                                    <MaterialCommunityIcons name="account" size={20} color="#999" />
                                    <TextInput
                                        style={styles.input}
                                        value={fullName}
                                        onChangeText={setFullName}
                                        placeholder="Enter your full name"
                                        placeholderTextColor="#999"
                                        autoCapitalize="words"
                                        autoComplete="name"
                                    />
                                </View>
                            </View>

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
                                        placeholder="At least 8 characters"
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
                                <Text style={styles.helperText}>Minimum 8 characters required</Text>
                            </View>

                            {/* Sign Up Button */}
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={handleSignUp}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={['#667eea', '#764ba2']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.actionGradient}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
                                            <Text style={styles.actionText}>Create Account</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            {/* Verification Code Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Verification Code</Text>
                                <View style={styles.inputContainer}>
                                    <MaterialCommunityIcons name="shield-key" size={20} color="#999" />
                                    <TextInput
                                        style={styles.input}
                                        value={code}
                                        onChangeText={setCode}
                                        placeholder="Enter 6-digit code"
                                        placeholderTextColor="#999"
                                        keyboardType="number-pad"
                                        maxLength={6}
                                    />
                                </View>
                                <Text style={styles.helperText}>Check your email for the code</Text>
                            </View>

                            {/* Verify Button */}
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={handleVerify}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={['#667eea', '#764ba2']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.actionGradient}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                                            <Text style={styles.actionText}>Verify Email</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Resend Code */}
                            <TouchableOpacity
                                style={styles.resendButton}
                                onPress={handleSignUp}
                            >
                                <Text style={styles.resendText}>Didn&apos;t receive code? Resend</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Go to Sign In */}
                    {!pendingVerification && (
                        <TouchableOpacity
                            style={styles.switchButton}
                            onPress={() => router.push('/(auth)/clerk-signin')}
                        >
                            <Text style={styles.switchText}>
                                Already have an account?{' '}
                                <Text style={styles.switchTextBold}>Sign In</Text>
                            </Text>
                        </TouchableOpacity>
                    )}
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
    helperText: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
        marginLeft: 4,
    },
    actionButton: {
        marginTop: 10,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    actionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    actionText: {
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
    resendButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    resendText: {
        fontSize: 14,
        color: '#667eea',
        fontWeight: '600',
    },
});
