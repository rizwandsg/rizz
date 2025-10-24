import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PUSH_TOKEN_KEY = '@rizzapp_push_token';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

/**
 * Register for push notifications and get push token
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
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

        try {
            token = (
                await Notifications.getExpoPushTokenAsync({
                    projectId: 'your-project-id', // Replace with your Expo project ID
                })
            ).data;
            console.log('✅ Push token:', token);

            // Save token to AsyncStorage
            await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
        } catch (error) {
            console.error('❌ Error getting push token:', error);
        }
    } else {
        console.log('⚠️ Must use physical device for Push Notifications');
    }

    return token;
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
    trigger?: Notifications.NotificationTriggerInput
) {
    try {
        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: true,
            },
            trigger: trigger || null, // null means immediate
        });
        console.log('✅ Notification scheduled:', id);
        return id;
    } catch (error) {
        console.error('❌ Error scheduling notification:', error);
        throw error;
    }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string) {
    try {
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
    try {
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
    try {
        const notifications = await Notifications.getAllScheduledNotificationsAsync();
        return notifications;
    } catch (error) {
        console.error('❌ Error getting scheduled notifications:', error);
        return [];
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
            body = `Expense of ₹${data.expenseAmount} has been added to "${data.projectName}"`;
            break;
        case NotificationType.EXPENSE_APPROVED:
            title = '✅ Expense Approved';
            body = `Your expense of ₹${data.expenseAmount} has been approved`;
            break;
        case NotificationType.EXPENSE_REJECTED:
            title = '❌ Expense Rejected';
            body = `Your expense of ₹${data.expenseAmount} has been rejected`;
            break;
        case NotificationType.PAYMENT_DUE:
            title = '⏰ Payment Due';
            body = `Payment of ₹${data.expenseAmount} is due on ${data.dueDate}`;
            break;
        case NotificationType.PAYMENT_OVERDUE:
            title = '🚨 Payment Overdue';
            body = `Payment of ₹${data.expenseAmount} is overdue!`;
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

    return await scheduleLocalNotification(title, body, { ...data, type });
}

/**
 * Check if notifications are enabled in app settings
 */
export async function areNotificationsEnabled(): Promise<boolean> {
    try {
        const settings = await AsyncStorage.getItem('@rizzapp_notification_settings');
        if (settings) {
            const parsed = JSON.parse(settings);
            return parsed.pushNotifications === true;
        }
        return true; // Default to enabled
    } catch (error) {
        console.error('❌ Error checking notification settings:', error);
        return true;
    }
}

/**
 * Add notification listener for when notification is received
 */
export function addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
) {
    return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add notification listener for when notification is tapped
 */
export function addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
) {
    return Notifications.addNotificationResponseReceivedListener(callback);
}
