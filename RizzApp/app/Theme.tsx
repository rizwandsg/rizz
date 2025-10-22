import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@rizzapp_theme';

export default function ThemeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [selectedTheme, setSelectedTheme] = useState('purple');

    const themes = [
        { id: 'purple', name: 'Purple Gradient', colors: ['#667eea', '#764ba2'] as const, icon: 'palette' },
        { id: 'blue', name: 'Blue Ocean', colors: ['#2196F3', '#1976D2'] as const, icon: 'water' },
        { id: 'green', name: 'Fresh Green', colors: ['#4CAF50', '#388E3C'] as const, icon: 'leaf' },
        { id: 'orange', name: 'Sunset Orange', colors: ['#FF9800', '#F57C00'] as const, icon: 'white-balance-sunny' },
        { id: 'pink', name: 'Rose Pink', colors: ['#E91E63', '#C2185B'] as const, icon: 'flower' },
        { id: 'teal', name: 'Ocean Teal', colors: ['#009688', '#00796B'] as const, icon: 'waves' },
    ];

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (savedTheme) {
                setSelectedTheme(savedTheme);
            }
        } catch (error) {
            console.error('Failed to load theme:', error);
        }
    };

    const handleThemeSelect = async (themeId: string) => {
        setSelectedTheme(themeId);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, themeId);
            Alert.alert(
                'Theme Selected',
                'Your theme preference has been saved. Theme changes will be applied in a future update.',
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('Failed to save theme:', error);
            Alert.alert('Error', 'Failed to save theme preference');
        }
    };

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
                    <Text style={styles.headerTitle}>Theme</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.description}>
                    Choose your preferred color theme for the app
                </Text>

                <View style={styles.themesContainer}>
                    {themes.map((theme) => (
                        <TouchableOpacity
                            key={theme.id}
                            style={[
                                styles.themeCard,
                                selectedTheme === theme.id && styles.selectedTheme
                            ]}
                            onPress={() => handleThemeSelect(theme.id)}
                        >
                            <LinearGradient
                                colors={theme.colors}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.themePreview}
                            >
                                <MaterialCommunityIcons name={theme.icon as any} size={32} color="#fff" />
                            </LinearGradient>
                            <Text style={styles.themeName}>{theme.name}</Text>
                            {selectedTheme === theme.id && (
                                <MaterialCommunityIcons
                                    name="check-circle"
                                    size={24}
                                    color="#4CAF50"
                                    style={styles.checkIcon}
                                />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Info */}
                <View style={styles.infoBox}>
                    <MaterialCommunityIcons name="information" size={20} color="#667eea" />
                    <Text style={styles.infoText}>
                        Theme changes will be available in a future update
                    </Text>
                </View>
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
    description: {
        fontSize: 15,
        color: '#666',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        textAlign: 'center',
    },
    themesContainer: {
        paddingHorizontal: 20,
        gap: 12,
    },
    themeCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    selectedTheme: {
        borderColor: '#4CAF50',
        shadowColor: '#4CAF50',
        shadowOpacity: 0.2,
    },
    themePreview: {
        width: 60,
        height: 60,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    themeName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    checkIcon: {
        marginLeft: 8,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#F5F5FF',
        padding: 16,
        borderRadius: 12,
        gap: 12,
        marginHorizontal: 20,
        marginTop: 24,
        marginBottom: 40,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#667eea',
        lineHeight: 18,
    },
});
