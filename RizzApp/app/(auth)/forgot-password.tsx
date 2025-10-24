import { useClerk, useSignIn } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

export default function ForgotPasswordScreen() {
    const { signIn, isLoaded } = useSignIn();
    const { signOut } = useClerk();
    const router = useRouter();
    
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'email' | 'code' | 'success'>('email');

    // Auto-navigate to login after successful password reset
    useEffect(() => {
        if (step === 'success') {
            const timer = setTimeout(() => {
                console.log('🔐 Auto-navigating to login after successful password reset');
                router.replace('/(auth)/clerk-signin');
            }, 2500);

            return () => clearTimeout(timer);
        }
    }, [step, router]);

    const handleSendCode = async () => {
        if (!isLoaded) return;

        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        setLoading(true);
        try {
            await signIn.create({
                strategy: 'reset_password_email_code',
                identifier: email.trim(),
            });
            
            console.log('✅ Password reset code sent to:', email);
            Alert.alert(
                'Code Sent!',
                'Please check your email for the verification code.',
                [{ text: 'OK', onPress: () => setStep('code') }]
            );
        } catch (err: any) {
            console.error('❌ Send Code Error:', err);
            Alert.alert(
                'Error',
                err.errors?.[0]?.message || 'Failed to send reset code. Please check your email and try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!isLoaded) return;

        if (!code.trim()) {
            Alert.alert('Error', 'Please enter the verification code');
            return;
        }

        if (!newPassword || newPassword.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters long');
            return;
        }

        setLoading(true);
        try {
            const result = await signIn.attemptFirstFactor({
                strategy: 'reset_password_email_code',
                code: code.trim(),
                password: newPassword,
            });

            if (result.status === 'complete') {
                console.log('✅ Password reset successful!');
                
                // Sign out the user after password reset so they can sign in with new password
                try {
                    await signOut();
                    await AsyncStorage.removeItem('@rizzapp_user');
                    await AsyncStorage.removeItem('@rizzapp_token');
                    console.log('✅ Signed out after password reset - user can now sign in with new password');
                } catch (signOutError) {
                    console.error('⚠️ Sign out error after password reset:', signOutError);
                }
                
                setStep('success');
            } else {
                Alert.alert('Error', 'Password reset incomplete. Please try again.');
            }
        } catch (err: any) {
            console.error('❌ Reset Password Error:', err);
            Alert.alert(
                'Error',
                err.errors?.[0]?.message || 'Invalid code or failed to reset password. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    if (step === 'success') {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={['#4c669f', '#3b5998']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <MaterialCommunityIcons name="check-circle" size={60} color="#fff" />
                    <Text style={styles.headerTitle}>Password Reset!</Text>
                </LinearGradient>

                <View style={styles.content}>
                    <View style={styles.successBox}>
                        <MaterialCommunityIcons name="lock-check" size={48} color="#4caf50" />
                        <Text style={styles.successTitle}>Success!</Text>
                        <Text style={styles.successText}>
                            Your password has been reset successfully.
                        </Text>
                        <Text style={styles.instructionText}>
                            Please sign in with your new password.
                        </Text>
                        <Text style={[styles.instructionText, { marginTop: 10, fontSize: 12, color: '#999' }]}>
                            Redirecting to sign in...
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.signInButton}
                        onPress={() => router.replace('/(auth)/clerk-signin')}
                    >
                        <LinearGradient
                            colors={['#667eea', '#764ba2']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.buttonGradient}
                        >
                            <MaterialCommunityIcons name="login" size={20} color="#fff" />
                            <Text style={styles.buttonText}>Go to Sign In</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (step === 'code') {
        return (
            <KeyboardAvoidingView 
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.header}
                    >
                        <MaterialCommunityIcons name="lock-reset" size={60} color="#fff" />
                        <Text style={styles.headerTitle}>Reset Password</Text>
                        <Text style={styles.headerSubtitle}>Step 2 of 2</Text>
                    </LinearGradient>

                    <View style={styles.content}>
                        <View style={styles.card}>
                            <View style={styles.infoBox}>
                                <MaterialCommunityIcons name="email-check" size={24} color="#667eea" />
                                <Text style={styles.infoText}>
                                    We sent a 6-digit code to {email}
                                </Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Verification Code</Text>
                                <View style={styles.inputWrapper}>
                                    <MaterialCommunityIcons 
                                        name="shield-key" 
                                        size={20} 
                                        color="#666" 
                                        style={styles.inputIcon} 
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter 6-digit code"
                                        value={code}
                                        onChangeText={setCode}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        autoFocus
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>New Password</Text>
                                <View style={styles.inputWrapper}>
                                    <MaterialCommunityIcons 
                                        name="lock" 
                                        size={20} 
                                        color="#666" 
                                        style={styles.inputIcon} 
                                    />
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        placeholder="Enter new password (min. 8 characters)"
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity 
                                        onPress={() => setShowPassword(!showPassword)}
                                        style={styles.eyeIcon}
                                    >
                                        <MaterialCommunityIcons 
                                            name={showPassword ? "eye-off" : "eye"} 
                                            size={20} 
                                            color="#666" 
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={handleResetPassword}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={['#667eea', '#764ba2']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.buttonGradient}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                                            <Text style={styles.buttonText}>Reset Password</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => setStep('email')}
                                disabled={loading}
                            >
                                <MaterialCommunityIcons name="arrow-left" size={18} color="#667eea" />
                                <Text style={styles.backButtonText}>Back to Email</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.resendButton}
                                onPress={handleSendCode}
                                disabled={loading}
                            >
                                <Text style={styles.resendButtonText}>Didn't receive the code? Resend</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <MaterialCommunityIcons name="lock-reset" size={60} color="#fff" />
                    <Text style={styles.headerTitle}>Reset Password</Text>
                    <Text style={styles.headerSubtitle}>Step 1 of 2</Text>
                </LinearGradient>

                <View style={styles.content}>
                    <View style={styles.card}>
                        <View style={styles.infoBox}>
                            <MaterialCommunityIcons name="information" size={24} color="#667eea" />
                            <Text style={styles.infoText}>
                                Enter your email address and we'll send you a verification code to reset your password.
                            </Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={styles.inputWrapper}>
                                <MaterialCommunityIcons 
                                    name="email" 
                                    size={20} 
                                    color="#666" 
                                    style={styles.inputIcon} 
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your email"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoFocus
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleSendCode}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#667eea', '#764ba2']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.buttonGradient}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="email-fast" size={20} color="#fff" />
                                        <Text style={styles.buttonText}>Send Verification Code</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                            disabled={loading}
                        >
                            <MaterialCommunityIcons name="arrow-left" size={18} color="#667eea" />
                            <Text style={styles.backButtonText}>Back to Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 30,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 20,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 8,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    infoBox: {
        backgroundColor: '#f0f4ff',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#667eea',
        lineHeight: 20,
    },
    successBox: {
        backgroundColor: '#fff',
        padding: 30,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 15,
        marginBottom: 10,
    },
    successText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 10,
    },
    instructionText: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
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
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 15,
        color: '#333',
    },
    eyeIcon: {
        padding: 8,
    },
    submitButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 8,
    },
    signInButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginTop: 16,
        gap: 6,
    },
    backButtonText: {
        color: '#667eea',
        fontSize: 14,
        fontWeight: '500',
    },
    resendButton: {
        alignItems: 'center',
        paddingVertical: 12,
        marginTop: 8,
    },
    resendButtonText: {
        color: '#667eea',
        fontSize: 13,
        textDecorationLine: 'underline',
    },
});
