import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HelpSupportScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const handleContactSupport = () => {
        Alert.alert(
            'Contact Support',
            'Choose a method to contact support:',
            [
                {
                    text: 'Email',
                    onPress: () => Linking.openURL('mailto:support@rizzapp.com'),
                },
                {
                    text: 'Phone',
                    onPress: () => Linking.openURL('tel:+919876543210'),
                },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const faqItems = [
        {
            question: 'How do I add a new project?',
            answer: 'Go to the Projects tab and tap the "+" button to create a new project.',
        },
        {
            question: 'How do I track expenses?',
            answer: 'Open a project and tap the Expenses tab, then add expenses for different categories.',
        },
        {
            question: 'Can I export my data?',
            answer: 'Yes, you can export reports from the Analytics section.',
        },
        {
            question: 'How do I delete a project?',
            answer: 'Long press on a project card and select Delete from the options.',
        },
    ];

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
                    <Text style={styles.headerTitle}>Help & Support</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Contact Support Card */}
                <TouchableOpacity style={styles.contactCard} onPress={handleContactSupport}>
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.contactGradient}
                    >
                        <MaterialCommunityIcons name="headset" size={40} color="#fff" />
                        <Text style={styles.contactTitle}>Contact Support</Text>
                        <Text style={styles.contactSubtitle}>We&apos;re here to help you</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Quick Links */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Links</Text>
                    
                    <TouchableOpacity style={styles.linkItem}>
                        <MaterialCommunityIcons name="book-open-variant" size={24} color="#667eea" />
                        <Text style={styles.linkText}>User Guide</Text>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.linkItem}>
                        <MaterialCommunityIcons name="video" size={24} color="#667eea" />
                        <Text style={styles.linkText}>Video Tutorials</Text>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.linkItem}>
                        <MaterialCommunityIcons name="forum" size={24} color="#667eea" />
                        <Text style={styles.linkText}>Community Forum</Text>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
                    </TouchableOpacity>
                </View>

                {/* FAQ */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                    
                    {faqItems.map((item, index) => (
                        <View key={index} style={styles.faqItem}>
                            <View style={styles.faqQuestion}>
                                <MaterialCommunityIcons name="help-circle" size={20} color="#667eea" />
                                <Text style={styles.faqQuestionText}>{item.question}</Text>
                            </View>
                            <Text style={styles.faqAnswer}>{item.answer}</Text>
                        </View>
                    ))}
                </View>

                {/* Contact Info */}
                <View style={styles.infoBox}>
                    <MaterialCommunityIcons name="email" size={20} color="#667eea" />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.infoLabel}>Email</Text>
                        <Text style={styles.infoValue}>support@rizzapp.com</Text>
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <MaterialCommunityIcons name="phone" size={20} color="#667eea" />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.infoLabel}>Phone</Text>
                        <Text style={styles.infoValue}>+91 10000001</Text>
                    </View>
                </View>

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
    contactCard: {
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    contactGradient: {
        padding: 32,
        alignItems: 'center',
    },
    contactTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 12,
    },
    contactSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
    },
    section: {
        backgroundColor: '#fff',
        marginTop: 20,
        paddingVertical: 12,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#999',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    linkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
        gap: 16,
    },
    linkText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: '#333',
    },
    faqItem: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    faqQuestion: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 8,
    },
    faqQuestionText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    faqAnswer: {
        fontSize: 14,
        color: '#666',
        marginLeft: 32,
        lineHeight: 20,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        marginHorizontal: 20,
        marginTop: 12,
        borderRadius: 12,
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    infoLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '500',
        color: '#333',
    },
});
