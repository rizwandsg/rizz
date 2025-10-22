import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AboutScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + 10 }]}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>About</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* App Logo */}
                <View style={styles.logoSection}>
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.logo}
                    >
                        <MaterialCommunityIcons name="briefcase" size={60} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.appName}>Rizz ERP</Text>
                    <Text style={styles.version}>Version 1.0.0</Text>
                    <Text style={styles.tagline}>Project & Expense Management</Text>
                </View>

                {/* App Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About This App</Text>
                    <Text style={styles.description}>
                        Rizz ERP is a comprehensive project and expense management application 
                        designed to help you track your projects, manage expenses, and analyze 
                        your business performance with ease.
                    </Text>
                </View>

                {/* Features */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Features</Text>
                    
                    <View style={styles.featureItem}>
                        <MaterialCommunityIcons name="briefcase" size={24} color="#667eea" />
                        <Text style={styles.featureText}>Project Management</Text>
                    </View>

                    <View style={styles.featureItem}>
                        <MaterialCommunityIcons name="receipt" size={24} color="#667eea" />
                        <Text style={styles.featureText}>Expense Tracking</Text>
                    </View>

                    <View style={styles.featureItem}>
                        <MaterialCommunityIcons name="currency-inr" size={24} color="#667eea" />
                        <Text style={styles.featureText}>Payment Management</Text>
                    </View>

                    <View style={styles.featureItem}>
                        <MaterialCommunityIcons name="chart-bar" size={24} color="#667eea" />
                        <Text style={styles.featureText}>Analytics & Reports</Text>
                    </View>

                    <View style={styles.featureItem}>
                        <MaterialCommunityIcons name="cloud-sync" size={24} color="#667eea" />
                        <Text style={styles.featureText}>Cloud Sync</Text>
                    </View>
                </View>

                {/* Legal */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Legal</Text>
                    
                    <TouchableOpacity style={styles.legalItem}>
                        <Text style={styles.legalText}>Terms of Service</Text>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.legalItem}>
                        <Text style={styles.legalText}>Privacy Policy</Text>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.legalItem}>
                        <Text style={styles.legalText}>Licenses</Text>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
                    </TouchableOpacity>
                </View>

                {/* Social Links */}
                <View style={styles.socialSection}>
                    <Text style={styles.sectionTitle}>Connect With Us</Text>
                    <View style={styles.socialButtons}>
                        <TouchableOpacity 
                            style={styles.socialButton}
                            onPress={() => Linking.openURL('https://twitter.com')}
                        >
                            <MaterialCommunityIcons name="twitter" size={28} color="#1DA1F2" />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.socialButton}
                            onPress={() => Linking.openURL('https://facebook.com')}
                        >
                            <MaterialCommunityIcons name="facebook" size={28} color="#4267B2" />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.socialButton}
                            onPress={() => Linking.openURL('https://instagram.com')}
                        >
                            <MaterialCommunityIcons name="instagram" size={28} color="#E1306C" />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.socialButton}
                            onPress={() => Linking.openURL('https://linkedin.com')}
                        >
                            <MaterialCommunityIcons name="linkedin" size={28} color="#0077B5" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Made with ❤️ by Rizz Team
                </Text>
                <Text style={styles.copyright}>
                    © 2025 Rizz ERP. All rights reserved.
                </Text>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingBottom: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        flex: 1,
    },
    logoSection: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    logo: {
        width: 100,
        height: 100,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    appName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    version: {
        fontSize: 14,
        color: '#999',
        marginBottom: 8,
    },
    tagline: {
        fontSize: 15,
        color: '#667eea',
        fontWeight: '500',
    },
    section: {
        backgroundColor: '#fff',
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#999',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 16,
    },
    description: {
        fontSize: 15,
        color: '#666',
        lineHeight: 24,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 16,
    },
    featureText: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    legalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    legalText: {
        fontSize: 15,
        color: '#333',
    },
    socialSection: {
        backgroundColor: '#fff',
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    socialButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
    },
    socialButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    footer: {
        textAlign: 'center',
        fontSize: 15,
        color: '#667eea',
        marginTop: 32,
        fontWeight: '500',
    },
    copyright: {
        textAlign: 'center',
        fontSize: 13,
        color: '#999',
        marginTop: 8,
    },
});
