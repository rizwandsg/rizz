import { MaterialCommunityIcons } from '@expo/vector-icons';
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

export default function ForgotPasswordScreen() {
    const router = useRouter();
    
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleResetPassword = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        setLoading(true);
        try {
            // TODO: Implement actual password reset API call
            // await resetPassword({ email: email.trim() });
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            setEmailSent(true);
            console.log('✅ Password reset email sent to:', email);
        } catch (err: any) {
            console.error('❌ Reset Password Error:', err);
            Alert.alert(
                'Error',
                err.message || 'Failed to send reset email. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    if (emailSent) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={['#4c669f', '#3b5998']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <MaterialCommunityIcons name="email-check" size={60} color="#fff" />
                    <Text style={styles.headerTitle}>Check Your Email</Text>
                </LinearGradient>

                <View style={styles.content}>
                    <View style={styles.successBox}>
                        <MaterialCommunityIcons name="check-circle" size={48} color="#4caf50" />
                        <Text style={styles.successTitle}>Email Sent!</Text>
                        <Text style={styles.successText}>
                            We&apos;ve sent a password reset link to:
                        </Text>
                        <Text style={styles.emailText}>{email}</Text>
                        <Text style={styles.instructionText}>
                            Please check your inbox and follow the instructions to reset your password.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={20} color="#667eea" />
                        <Text style={styles.backText}>Back to Login</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#4c669f', '#3b5998']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <MaterialCommunityIcons name="lock-reset" size={60} color="#fff" />
                <Text style={styles.headerTitle}>Forgot Password</Text>
                <Text style={styles.headerSubtitle}>
                    Enter your email to receive a reset link
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
                    <View style={styles.infoBox}>
                        <MaterialCommunityIcons name="information" size={20} color="#1976d2" />
                        <Text style={styles.infoText}>
                            We&apos;ll send you an email with instructions to reset your password.
                        </Text>
                    </View>

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

                    <TouchableOpacity
                        style={styles.resetButton}
                        onPress={handleResetPassword}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={['#4c669f', '#3b5998']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.resetGradient}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="email-outline" size={20} color="#fff" />
                                    <Text style={styles.resetText}>Send Reset Link</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={20} color="#667eea" />
                        <Text style={styles.backText}>Back to Login</Text>
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
        textAlign: 'center',
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
    resetButton: {
        marginTop: 10,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#4c669f',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    resetGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    resetText: {
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
    emailText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3b5998',
        marginBottom: 15,
    },
    instructionText: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
});
