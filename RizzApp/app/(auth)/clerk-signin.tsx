import { identityError, signInIdentity } from '../../services/firebaseIdentity';
import { useIdentity } from '../../context/IdentityContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
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

export default function ClerkSignInScreen() {
    const { isLoaded } = useIdentity();
    const router = useRouter();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const submitting = useRef(false);

    const handleSignIn = async () => {
        if (!isLoaded || submitting.current) return;
        if (!email.trim() || !password) { setErrorMessage('Enter your email and password'); Alert.alert('Error', 'Enter your email and password'); return; }
        submitting.current = true;
        setLoading(true); setErrorMessage(null);
        try {
            const result = await signInIdentity(email.trim(), password);
            router.replace(result.emailVerified ? '/' : '/(auth)/verify-email');
        } catch (error: any) {
            setErrorMessage(identityError(error)); Alert.alert('Sign In Failed', identityError(error));
        } finally { submitting.current = false; setLoading(false); }
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
                    {errorMessage ? <Text accessibilityRole="alert" style={{color:"#a02020", marginBottom:16}}>{errorMessage}</Text> : null}
                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="email" size={20} color="#999" />
                            <TextInput
                                style={styles.input}
                                testID="auth-email" value={email}
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
                                testID="auth-password" value={password}
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

                    {/* Forgot Password Link */}
                    <TouchableOpacity 
                        style={styles.forgotPasswordButton}
                        onPress={() => router.push('/(auth)/forgot-password')}
                    >
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    {/* Sign In Button */}
                    <TouchableOpacity
                        style={styles.signInButton}
                        testID="auth-submit" onPress={handleSignIn}
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
    forgotPasswordButton: {
        alignSelf: 'flex-end',
        marginTop: 8,
        marginBottom: 4,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: '#667eea',
        fontWeight: '600',
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
