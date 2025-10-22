import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

    const toggleSetting = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
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
});
