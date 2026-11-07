/* eslint-disable @typescript-eslint/no-require-imports */
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const PUSH_TOKEN_KEY = '@rizzapp_push_token';

// Check if running in Expo Go - use executionEnvironment instead of appOwnership
// executionEnvironment will be 'storeClient' for Expo Go, 'standalone' for production, 'bare' for bare workflow
const isExpoGo = Constants.executionEnvironment === 'storeClient';

console.log('🔍 Notification Service - Execution Environment:', Constants.executionEnvironment);
console.log('🔍 Notification Service - App Ownership:', Constants.appOwnership);
console.log('🔍 Notification Service - Is Expo Go:', isExpoGo);

// Configure notification handler for development/production builds
if (!isExpoGo) {
    try {
        const Notifications = require('expo-notifications');
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldShowBanner: true,
                shouldShowList: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
            }),
        });
        console.log('✅ Notification handler configured');
    } catch (error) {
        console.log('⚠️ Could not configure notification handler:', error);
    }
}

/**
 * Notification types for the app
 */
export enum NotificationType {
    PROJECT_CREATED = 'project_created',
    PROJECT_UPDATED = 'project_updated',
    PROJECT_COMPLETED = 'project_completed',
    EXPENSE_ADDED = 'expense_added',
    EXPENSE_APPROVED = 'expense_approved',
    EXPENSE_REJECTED = 'expense_rejected',
    PAYMENT_DUE = 'payment_due',
    PAYMENT_OVERDUE = 'payment_overdue',
    USER_ADDED = 'user_added',
    WEEKLY_REPORT = 'weekly_report',
}

/**
 * Register for push notifications and get push token
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    // Skip push token registration in Expo Go
    if (isExpoGo) {
        console.log('⚠️ Push notifications not supported in Expo Go. Use a development build for full support.');
        return undefined;
    }

    // In development/production build, use the actual notification modules
    try {
        const { Platform } = require('react-native');
        const Notifications = require('expo-notifications');
        const Device = require('expo-device');

        // Configure handler
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldShowBanner: true,
                shouldShowList: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
            }),
        });

        let token: string | undefined;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('❌ Failed to get push token for push notification!');
                return undefined;
            }

            const projectId = Constants.expoConfig?.extra?.eas?.projectId;

            if (!projectId) {
                console.log('⚠️ Project ID not configured. Add it to app.json under extra.eas.projectId');
                return undefined;
            }

            token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

            if (token) {
                await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
            }
        } else {
            console.log('⚠️ Must use physical device for Push Notifications');
        }

        return token;
    } catch (error) {
        console.error('❌ Error in registerForPushNotificationsAsync:', error);
        return undefined;
    }
}

/**
 * Get the saved push token
 */
export async function getPushToken(): Promise<string | null> {
    try {
        return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    } catch (error) {
        console.error('❌ Error getting push token:', error);
        return null;
    }
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: any
): Promise<string | undefined> {
    console.log('📱 scheduleLocalNotification called:', title);
    console.log('📱 isExpoGo:', isExpoGo);
    
    if (isExpoGo) {
        console.log(`📬 [Expo Go] Local Notification: ${title} - ${body}`);
        return undefined;
    }

    console.log('📱 Attempting to schedule actual notification...');
    try {
        const { Platform } = require('react-native');
        const Notifications = require('expo-notifications');
        
        // Request permissions if not already granted
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
            console.log('📱 Requesting notification permissions...');
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
            console.error('❌ Notification permissions not granted');
            return undefined;
        }
        
        console.log('✅ Notification permissions granted');
        
        // Create Android notification channel if on Android
        if (Platform.OS === 'android') {
            console.log('📱 Setting up Android notification channel...');
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Default Notifications',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#667eea',
                sound: 'default',
                enableVibrate: true,
                showBadge: true,
            });
            console.log('✅ Android notification channel created');
        }
        
        console.log('📱 Scheduling notification with title:', title);
        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.MAX,
                vibrate: [0, 250, 250, 250],
                badge: 1,
                categoryIdentifier: 'default',
            },
            trigger: trigger || null,
        });
        console.log('✅ Notification scheduled successfully! ID:', id);
        console.log('✅ Notification should appear in notification bar now');
        console.log('✅ Check your device notification tray');
        return id;
    } catch (error) {
        console.error('❌ Error scheduling notification:', error);
        console.error('❌ Error details:', JSON.stringify(error));
        console.error('❌ Full error object:', error);
        return undefined;
    }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string) {
    if (isExpoGo) return;

    try {
        const Notifications = require('expo-notifications');
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        console.log('✅ Notification cancelled:', notificationId);
    } catch (error) {
        console.error('❌ Error cancelling notification:', error);
    }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications() {
    if (isExpoGo) return;

    try {
        const Notifications = require('expo-notifications');
        await Notifications.cancelAllScheduledNotificationsAsync();
        console.log('✅ All notifications cancelled');
    } catch (error) {
        console.error('❌ Error cancelling all notifications:', error);
    }
}

/**
 * Get all scheduled notifications
 */
export async function getAllScheduledNotifications() {
    if (isExpoGo) return [];

    try {
        const Notifications = require('expo-notifications');
        const notifications = await Notifications.getAllScheduledNotificationsAsync();
        return notifications;
    } catch (error) {
        console.error('❌ Error getting scheduled notifications:', error);
        return [];
    }
}

/**
 * Send notification based on app events
 */
export async function sendAppNotification(
    type: NotificationType,
    data: {
        projectName?: string;
        expenseAmount?: number;
        userName?: string;
        dueDate?: string;
        [key: string]: any;
    }
) {
    console.log('🔔 sendAppNotification called with type:', type, 'data:', data);
    
    let title = '';
    let body = '';

    switch (type) {
        case NotificationType.PROJECT_CREATED:
            title = '🎉 New Project Created';
            body = `Project "${data.projectName}" has been created successfully`;
            break;
        case NotificationType.PROJECT_UPDATED:
            title = '📝 Project Updated';
            body = `Project "${data.projectName}" has been updated`;
            break;
        case NotificationType.PROJECT_COMPLETED:
            title = '✅ Project Completed';
            body = `Project "${data.projectName}" has been marked as completed`;
            break;
        case NotificationType.EXPENSE_ADDED:
            title = '💰 New Expense Added';
            body = `Expense of ₹${data.expenseAmount?.toFixed(2)} has been added to "${data.projectName}"`;
            break;
        case NotificationType.EXPENSE_APPROVED:
            title = '✅ Expense Approved';
            body = `Your expense of ₹${data.expenseAmount?.toFixed(2)} has been approved`;
            break;
        case NotificationType.EXPENSE_REJECTED:
            title = '❌ Expense Rejected';
            body = `Your expense of ₹${data.expenseAmount?.toFixed(2)} has been rejected`;
            break;
        case NotificationType.PAYMENT_DUE:
            title = '⏰ Payment Due';
            body = `Payment of ₹${data.expenseAmount?.toFixed(2)} is due on ${data.dueDate}`;
            break;
        case NotificationType.PAYMENT_OVERDUE:
            title = '🚨 Payment Overdue';
            body = `Payment of ₹${data.expenseAmount?.toFixed(2)} is overdue!`;
            break;
        case NotificationType.USER_ADDED:
            title = '👤 New Team Member';
            body = `${data.userName} has been added to your team`;
            break;
        case NotificationType.WEEKLY_REPORT:
            title = '📊 Weekly Report';
            body = `Your weekly report is ready to view`;
            break;
    }

    // In Expo Go, just log the notification
    if (isExpoGo) {
        console.log(`📬 [Expo Go] Notification: ${title} - ${body}`, data);
        return undefined;
    }

    console.log('📱 About to call scheduleLocalNotification...');
    console.log('📱 Title:', title);
    console.log('📱 Body:', body);
    
    try {
        const result = await scheduleLocalNotification(title, body, { ...data, type });
        console.log('✅ sendAppNotification completed successfully');
        return result;
    } catch (error) {
        console.error('❌ Error in sendAppNotification:', error);
        throw error;
    }
}

/**
 * Check if notifications are enabled in app settings
 */
export async function areNotificationsEnabled(): Promise<boolean> {
    try {
        const settings = await AsyncStorage.getItem('@rizzapp_notification_settings');
        console.log('🔍 Checking notification settings:', settings);
        if (settings) {
            const parsed = JSON.parse(settings);
            console.log('✅ Parsed settings:', parsed);
            console.log('✅ Push notifications value:', parsed.pushNotifications);
            console.log('✅ Type of pushNotifications:', typeof parsed.pushNotifications);
            
            // Check if explicitly set to false
            if (parsed.pushNotifications === false) {
                console.log('⚠️ Push notifications are DISABLED in settings');
                return false;
            }
            console.log('✅ Push notifications are ENABLED');
            return true;
        }
        console.log('✅ No settings found, defaulting to enabled');
        return true; // Default to enabled
    } catch (error) {
        console.error('❌ Error checking notification settings:', error);
        return true;
    }
}

/**
 * Force enable notifications (for debugging)
 */
export async function forceEnableNotifications(): Promise<void> {
    try {
        const settings = await AsyncStorage.getItem('@rizzapp_notification_settings');
        if (settings) {
            const parsed = JSON.parse(settings);
            parsed.pushNotifications = true;
            await AsyncStorage.setItem('@rizzapp_notification_settings', JSON.stringify(parsed));
            console.log('✅ Force enabled notifications');
        } else {
            await AsyncStorage.setItem('@rizzapp_notification_settings', JSON.stringify({
                pushNotifications: true,
                emailNotifications: false,
                projectUpdates: true,
                expenseAlerts: true,
                paymentReminders: true,
                weeklyReports: false,
            }));
            console.log('✅ Created settings with notifications enabled');
        }
    } catch (error) {
        console.error('❌ Error force enabling notifications:', error);
    }
}

/**
 * Check and display notification permissions
 */
export async function checkNotificationPermissions(): Promise<void> {
    if (isExpoGo) {
        console.log('⚠️ In Expo Go - permissions not available');
        return;
    }

    try {
        const Notifications = require('expo-notifications');
        const { status, ios, android } = await Notifications.getPermissionsAsync();
        
        console.log('📱 === NOTIFICATION PERMISSIONS ===');
        console.log('Status:', status);
        console.log('Granted:', status === 'granted');
        
        if (android) {
            console.log('Android settings:', JSON.stringify(android, null, 2));
        }
        
        if (ios) {
            console.log('iOS settings:', JSON.stringify(ios, null, 2));
        }
        
        console.log('=================================');
        
        return;
    } catch (error) {
        console.error('❌ Error checking permissions:', error);
    }
}

/**
 * Test notification system - sends a test notification immediately
 */
export async function testNotificationSystem(): Promise<boolean> {
    console.log('🧪 === TESTING NOTIFICATION SYSTEM ===');
    console.log('🔍 Is Expo Go:', isExpoGo);
    console.log('🔍 Execution Environment:', Constants.executionEnvironment);
    
    if (isExpoGo) {
        console.log('⚠️ Cannot test in Expo Go - notifications not supported');
        return false;
    }
    
    try {
        // Check permissions
        await checkNotificationPermissions();
        
        // Try to schedule a test notification
        console.log('🧪 Scheduling test notification...');
        const id = await scheduleLocalNotification(
            '🧪 Test Notification',
            'If you see this in your notification bar, notifications are working!',
            { test: true }
        );
        
        if (id) {
            console.log('✅ TEST PASSED - Notification scheduled with ID:', id);
            console.log('✅ Check your device notification bar now!');
            return true;
        } else {
            console.log('❌ TEST FAILED - No notification ID returned');
            return false;
        }
    } catch (error) {
        console.error('❌ TEST FAILED - Error:', error);
        return false;
    }
}

/**
 * Add notification listener for when notification is received
 */
export function addNotificationReceivedListener(callback: (notification: any) => void) {
    if (isExpoGo) {
        console.log('⚠️ Notification listeners not available in Expo Go');
        return { remove: () => {} };
    }

    try {
        const Notifications = require('expo-notifications');
        return Notifications.addNotificationReceivedListener(callback);
    } catch (error) {
        console.error('❌ Error adding notification listener:', error);
        return { remove: () => {} };
    }
}

/**
 * Add notification listener for when notification is tapped
 */
export function addNotificationResponseListener(callback: (response: any) => void) {
    if (isExpoGo) {
        console.log('⚠️ Notification listeners not available in Expo Go');
        return { remove: () => {} };
    }

    try {
        const Notifications = require('expo-notifications');
        return Notifications.addNotificationResponseReceivedListener(callback);
    } catch (error) {
        console.error('❌ Error adding notification response listener:', error);
        return { remove: () => {} };
    }
}
