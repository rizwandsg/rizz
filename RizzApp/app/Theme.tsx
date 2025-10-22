import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEMES, ThemeId, useTheme } from '../context/ThemeContext';

export default function ThemeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme, setTheme } = useTheme();

    const themes = [
        { ...THEMES.purple, icon: 'palette' },
        { ...THEMES.blue, icon: 'water' },
        { ...THEMES.green, icon: 'leaf' },
        { ...THEMES.orange, icon: 'white-balance-sunny' },
        { ...THEMES.pink, icon: 'flower' },
        { ...THEMES.teal, icon: 'waves' },
    ];

    const handleThemeSelect = async (themeId: ThemeId) => {
        try {
            await setTheme(themeId);
            Alert.alert(
                'Theme Applied',
                'Your theme has been successfully updated!',
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
                colors={theme.colors}
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
                    {themes.map((themeOption) => (
                        <TouchableOpacity
                            key={themeOption.id}
                            style={[
                                styles.themeCard,
                                theme.id === themeOption.id && styles.selectedTheme
                            ]}
                            onPress={() => handleThemeSelect(themeOption.id)}
                        >
                            <LinearGradient
                                colors={themeOption.colors}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.themePreview}
                            >
                                <MaterialCommunityIcons name={themeOption.icon as any} size={32} color="#fff" />
                            </LinearGradient>
                            <Text style={styles.themeName}>{themeOption.name}</Text>
                            {theme.id === themeOption.id && (
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
                    <MaterialCommunityIcons name="information" size={20} color={theme.primaryColor} />
                    <Text style={[styles.infoText, { color: theme.primaryColor }]}>
                        Theme is now applied! You&apos;ll see the new colors in headers and buttons throughout the app.
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
