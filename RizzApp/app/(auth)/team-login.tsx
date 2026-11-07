import { useSignIn } from '@clerk/clerk-expo';
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

export default function TeamLoginScreen() {
    const router = useRouter();
    const { signIn, setActive, isLoaded } = useSignIn();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const submitting = useRef(false);

    const handleEmailChange = (text: string) => setEmail(text);
    const getFullEmail = () => email.trim();


    const handleLogin = async () => {
        if (!isLoaded || submitting.current) return;
        if (!email.trim() || !password) { Alert.alert('Error', 'Enter your email and password'); return; }
        submitting.current = true;
        setLoading(true);
        try {
            const result = await signIn.create({ identifier: getFullEmail(), password });
            if (result.status !== 'complete' || !result.createdSessionId) throw new Error('Additional verification is required. Complete your account verification before signing in.');
            await setActive({ session: result.createdSessionId });
            router.replace('/(tabs)/home');
        } catch (error: any) {
            Alert.alert('Sign In Failed', error.errors?.[0]?.message || error.message || 'Please try again');
        } finally { submitting.current = false; setLoading(false); }
    };

    return (
        <View style={styles.container}>
            {/* Header with Gradient */}
            <LinearGradient
                colors={['#4c669f', '#3b5998']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <MaterialCommunityIcons name="account-group" size={60} color="#fff" />
                <Text style={styles.headerTitle}>Team Member Login</Text>
                <Text style={styles.headerSubtitle}>Sign in to access your workspace</Text>
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
                    {/* Info Box */}
                    <View style={styles.infoBox}>
                        <MaterialCommunityIcons name="information" size={20} color="#3b5998" />
                        <Text style={styles.infoText}>
                            This login is for team members added by workspace owners.
                        </Text>
                    </View>

                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.emailInputWrapper}>
                            <MaterialCommunityIcons name="email" size={20} color="#999" style={styles.emailIcon} />
                            <TextInput
                                style={styles.emailUsernameInput}
                                value={email}
                                onChangeText={handleEmailChange}
                                placeholder="name@example.com"
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

                    <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                        <Text style={styles.backText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    {/* Login Button */}
                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={['#4c669f', '#3b5998']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.loginGradient}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="login" size={20} color="#fff" />
                                    <Text style={styles.loginText}>Sign In as Team Member</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Back to Owner Login */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.replace('/(auth)/clerk-signin')}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={20} color="#667eea" />
                        <Text style={styles.backText}>Back to Owner Login</Text>
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
        color: '#fff',
        opacity: 0.9,
        marginTop: 8,
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 30,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#e3f2fd',
        padding: 15,
        borderRadius: 12,
        marginBottom: 25,
        alignItems: 'center',
    },
    infoText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 13,
        color: '#1976d2',
        lineHeight: 18,
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
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    input: {
        flex: 1,
        paddingVertical: 15,
        paddingHorizontal: 10,
        fontSize: 16,
        color: '#333',
    },
    emailInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingLeft: 15,
        paddingRight: 15,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    emailIcon: {
        marginRight: 10,
    },
    emailUsernameInput: {
        flex: 1,
        paddingVertical: 15,
        fontSize: 16,
        color: '#333',
    },
    emailDomain: {
        fontSize: 16,
        color: '#4c669f',
        fontWeight: '600',
        marginLeft: 5,
    },
    loginButton: {
        marginTop: 10,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#4c669f',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    loginGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    loginText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
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
        marginHorizontal: 15,
        fontSize: 12,
        color: '#999',
        fontWeight: '500',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#667eea',
        backgroundColor: '#fff',
        gap: 8,
    },
    backText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#667eea',
    },
});
