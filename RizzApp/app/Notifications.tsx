import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    NotificationType,
    registerForPushNotificationsAsync,
    sendAppNotification,
    forceEnableNotifications,
    checkNotificationPermissions,
    testNotificationSystem
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
                    <Text style={styles.sectionTitle}>Test Notifications</Text>
                    
                    {/* Expo Go Warning */}
                    <View style={styles.warningBox}>
                        <MaterialCommunityIcons name="information" size={20} color="#f59e0b" />
                        <Text style={styles.warningText}>
                            In Expo Go, notifications are logged to console only. For actual popups, build a development build.
                        </Text>
                    </View>

                    {/* Test Buttons */}
                    <TouchableOpacity
                        style={styles.testButton}
                        onPress={async () => {
                            try {
                                console.log('🧪 Testing PROJECT_CREATED notification...');
                                await sendAppNotification(NotificationType.PROJECT_CREATED, {
                                    projectName: 'Test Office Renovation',
                                });
                                Alert.alert(
                                    '✅ Notification Sent!', 
                                    'Check the console logs for the notification output.\n\nIn Expo Go, notifications only appear in logs, not as popups.',
                                    [{ text: 'OK' }]
                                );
                            } catch (error) {
                                Alert.alert('Error', 'Failed to send notification');
                                console.error('Test notification error:', error);
                            }
                        }}
                    >
                        <MaterialCommunityIcons name="briefcase-plus" size={20} color="#667eea" />
                        <Text style={styles.testButtonText}>Test Project Created</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.testButton}
                        onPress={async () => {
                            try {
                                console.log('🧪 Testing EXPENSE_ADDED notification...');
                                await sendAppNotification(NotificationType.EXPENSE_ADDED, {
                                    projectName: 'Office Renovation',
                                    expenseAmount: 5000,
                                    description: 'Test Expense',
                                });
                                Alert.alert(
                                    '✅ Notification Sent!', 
                                    'Check the console logs for the notification output.\n\nIn Expo Go, notifications only appear in logs, not as popups.',
                                    [{ text: 'OK' }]
                                );
                            } catch (error) {
                                Alert.alert('Error', 'Failed to send notification');
                                console.error('Test notification error:', error);
                            }
                        }}
                    >
                        <MaterialCommunityIcons name="receipt-text" size={20} color="#667eea" />
                        <Text style={styles.testButtonText}>Test Expense Added</Text>
                    </TouchableOpacity>

                    {/* Fix Button */}
                    <TouchableOpacity
                        style={[styles.testButton, { backgroundColor: '#fef3c7' }]}
                        onPress={async () => {
                            try {
                                console.log('🔧 Forcing notifications to be enabled...');
                                await forceEnableNotifications();
                                await loadSettings(); // Reload settings
                                Alert.alert(
                                    '✅ Settings Fixed!', 
                                    'Push notifications have been force-enabled. Try creating a project or expense now.',
                                    [{ text: 'OK' }]
                                );
                            } catch (error) {
                                Alert.alert('Error', 'Failed to fix settings');
                                console.error('Fix settings error:', error);
                            }
                        }}
                    >
                        <MaterialCommunityIcons name="wrench" size={20} color="#f59e0b" />
                        <Text style={[styles.testButtonText, { color: '#f59e0b' }]}>
                            Fix Notification Settings
                        </Text>
                    </TouchableOpacity>

                    {/* Check Permissions Button */}
                    <TouchableOpacity
                        style={[styles.testButton, { backgroundColor: '#dbeafe' }]}
                        onPress={async () => {
                            try {
                                console.log('🔍 Checking notification permissions...');
                                await checkNotificationPermissions();
                                Alert.alert(
                                    '✅ Permissions Checked!', 
                                    'Check the console for detailed permission information.',
                                    [{ text: 'OK' }]
                                );
                            } catch (error) {
                                Alert.alert('Error', 'Failed to check permissions');
                                console.error('Check permissions error:', error);
                            }
                        }}
                    >
                        <MaterialCommunityIcons name="shield-check" size={20} color="#3b82f6" />
                        <Text style={[styles.testButtonText, { color: '#3b82f6' }]}>
                            Check Permissions
                        </Text>
                    </TouchableOpacity>

                    {/* Full System Test Button */}
                    <TouchableOpacity
                        style={[styles.testButton, { backgroundColor: '#dcfce7' }]}
                        onPress={async () => {
                            try {
                                console.log('🧪 Running full notification system test...');
                                const success = await testNotificationSystem();
                                if (success) {
                                    Alert.alert(
                                        '✅ Test Passed!', 
                                        'Notification system is working! Check your notification bar.',
                                        [{ text: 'OK' }]
                                    );
                                } else {
                                    Alert.alert(
                                        '❌ Test Failed', 
                                        'Notification system is not working. Check console for details.',
                                        [{ text: 'OK' }]
                                    );
                                }
                            } catch (error) {
                                Alert.alert('Error', 'Test failed with error. Check console.');
                                console.error('Full system test error:', error);
                            }
                        }}
                    >
                        <MaterialCommunityIcons name="beaker" size={20} color="#16a34a" />
                        <Text style={[styles.testButtonText, { color: '#16a34a' }]}>
                            Full System Test
                        </Text>
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
    warningBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#fffbeb',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        gap: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#f59e0b',
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        color: '#92400e',
        lineHeight: 18,
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
