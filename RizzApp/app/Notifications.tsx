import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    registerForPushNotificationsAsync,
    scheduleLocalNotification,
    NotificationType,
    sendAppNotification,
} from '../services/notificationService';

const NOTIFICATIONS_STORAGE_KEY = '@rizzapp_notification_settings';

export default function NotificationsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [settings, setSettings] = useState({
        pushNotifications: true,
        emailNotifications: false,
        projectUpdates: true,
        expenseAlerts: true,
        paymentReminders: true,
        weeklyReports: false,
    });
    const [pushToken, setPushToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSettings();
        initializeNotifications();
    }, []);

    const initializeNotifications = async () => {
        try {
            const token = await registerForPushNotificationsAsync();
            if (token) {
                setPushToken(token);
                console.log('✅ Push notifications initialized:', token);
            }
        } catch (error) {
            console.error('❌ Failed to initialize notifications:', error);
        }
    };

    const loadSettings = async () => {
        try {
            const savedSettings = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
            if (savedSettings) {
                setSettings(JSON.parse(savedSettings));
            }
        } catch (error) {
            console.error('Failed to load notification settings:', error);
        }
    };

    const toggleSetting = async (key: keyof typeof settings) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        setSettings(newSettings);
        
        try {
            await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(newSettings));
            
            // Show confirmation based on the setting
            const settingNames: Record<string, string> = {
                pushNotifications: 'Push Notifications',
                emailNotifications: 'Email Notifications',
                projectUpdates: 'Project Updates',
                expenseAlerts: 'Expense Alerts',
                paymentReminders: 'Payment Reminders',
                weeklyReports: 'Weekly Reports',
            };
            
            const settingName = settingNames[key];
            const status = newSettings[key] ? 'enabled' : 'disabled';
            
            Alert.alert(
                'Settings Updated',
                `${settingName} ${status} successfully!`,
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('Failed to save notification settings:', error);
            Alert.alert('Error', 'Failed to save notification settings');
            // Revert the change
            setSettings(settings);
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
                    <Text style={styles.headerTitle}>Notifications</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* General Notifications */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>General</Text>
                    
                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons name="bell" size={24} color="#667eea" />
                            <View style={styles.settingText}>
                                <Text style={styles.settingName}>Push Notifications</Text>
                                <Text style={styles.settingDesc}>Receive push notifications</Text>
                            </View>
                        </View>
                        <Switch
                            value={settings.pushNotifications}
                            onValueChange={() => toggleSetting('pushNotifications')}
                            trackColor={{ false: '#ddd', true: '#667eea' }}
                            thumbColor="#fff"
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons name="email" size={24} color="#667eea" />
                            <View style={styles.settingText}>
                                <Text style={styles.settingName}>Email Notifications</Text>
                                <Text style={styles.settingDesc}>Receive email notifications</Text>
                            </View>
                        </View>
                        <Switch
                            value={settings.emailNotifications}
                            onValueChange={() => toggleSetting('emailNotifications')}
                            trackColor={{ false: '#ddd', true: '#667eea' }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                {/* Project & Expense Notifications */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Projects & Expenses</Text>
                    
                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons name="briefcase" size={24} color="#667eea" />
                            <View style={styles.settingText}>
                                <Text style={styles.settingName}>Project Updates</Text>
                                <Text style={styles.settingDesc}>Notifications for project changes</Text>
                            </View>
                        </View>
                        <Switch
                            value={settings.projectUpdates}
                            onValueChange={() => toggleSetting('projectUpdates')}
                            trackColor={{ false: '#ddd', true: '#667eea' }}
                            thumbColor="#fff"
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons name="receipt" size={24} color="#667eea" />
                            <View style={styles.settingText}>
                                <Text style={styles.settingName}>Expense Alerts</Text>
                                <Text style={styles.settingDesc}>Notifications for new expenses</Text>
                            </View>
                        </View>
                        <Switch
                            value={settings.expenseAlerts}
                            onValueChange={() => toggleSetting('expenseAlerts')}
                            trackColor={{ false: '#ddd', true: '#667eea' }}
                            thumbColor="#fff"
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons name="currency-inr" size={24} color="#667eea" />
                            <View style={styles.settingText}>
                                <Text style={styles.settingName}>Payment Reminders</Text>
                                <Text style={styles.settingDesc}>Reminders for pending payments</Text>
                            </View>
                        </View>
                        <Switch
                            value={settings.paymentReminders}
                            onValueChange={() => toggleSetting('paymentReminders')}
                            trackColor={{ false: '#ddd', true: '#667eea' }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                {/* Reports */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Reports</Text>
                    
                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons name="chart-bar" size={24} color="#667eea" />
                            <View style={styles.settingText}>
                                <Text style={styles.settingName}>Weekly Reports</Text>
                                <Text style={styles.settingDesc}>Weekly summary of activities</Text>
                            </View>
                        </View>
                        <Switch
                            value={settings.weeklyReports}
                            onValueChange={() => toggleSetting('weeklyReports')}
                            trackColor={{ false: '#ddd', true: '#667eea' }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                {/* Test Notification */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Test</Text>
                    
                    <TouchableOpacity
                        style={styles.testButton}
                        onPress={async () => {
                            try {
                                await sendAppNotification(NotificationType.PROJECT_CREATED, {
                                    projectName: 'Test Project',
                                });
                                Alert.alert('Success', 'Test notification sent!');
                            } catch (error) {
                                Alert.alert('Error', 'Failed to send notification');
                            }
                        }}
                    >
                        <MaterialCommunityIcons name="bell-ring" size={20} color="#667eea" />
                        <Text style={styles.testButtonText}>Send Test Notification</Text>
                    </TouchableOpacity>

                    {pushToken && (
                        <View style={styles.tokenContainer}>
                            <Text style={styles.tokenLabel}>Push Token:</Text>
                            <Text style={styles.tokenText} numberOfLines={2}>{pushToken}</Text>
                        </View>
                    )}
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
    section: {
        backgroundColor: '#fff',
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#999',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 16,
    },
    settingText: {
        flex: 1,
    },
    settingName: {
        fontSize: 15,
        fontWeight: '500',
        color: '#333',
        marginBottom: 2,
    },
    settingDesc: {
        fontSize: 13,
        color: '#999',
    },
    testButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f4ff',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 8,
        gap: 10,
        marginVertical: 8,
    },
    testButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#667eea',
    },
    tokenContainer: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    tokenLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        marginBottom: 4,
    },
    tokenText: {
        fontSize: 10,
        color: '#999',
        fontFamily: 'monospace',
    },
});
