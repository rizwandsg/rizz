import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    createSubUser,
    CreateSubUserData,
    deleteSubUser,
    getSubUsers,
    resetSubUserPassword,
    SubUser,
    updateSubUser
} from '../../api/authApi';

export default function UsersScreen() {
    const insets = useSafeAreaInsets();
    const [users, setUsers] = useState<SubUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState<SubUser | null>(null);
    
    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [saving, setSaving] = useState(false);

    // Load sub-users
    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await getSubUsers();
            setUsers(data);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadUsers();
        }, [])
    );

    // Open add user modal
    const handleAddUser = () => {
        setEditingUser(null);
        setEmail('');
        setPassword('');
        setFullName('');
        setPhone('');
        setIsActive(true);
        setModalVisible(true);
    };

    // Open edit user modal
    const handleEditUser = (user: SubUser) => {
        setEditingUser(user);
        setEmail(user.email);
        setPassword(''); // Don't show existing password
        setFullName(user.full_name);
        setPhone(user.phone || '');
        setIsActive(user.is_active);
        setModalVisible(true);
    };

    // Save user (create or update)
    const handleSaveUser = async () => {
        // Validation
        if (!fullName.trim()) {
            Alert.alert('Validation Error', 'Please enter full name');
            return;
        }

        if (!editingUser) {
            // Creating new user - validate email and password
            if (!email.trim()) {
                Alert.alert('Validation Error', 'Please enter email');
                return;
            }
            if (!password.trim() || password.length < 6) {
                Alert.alert('Validation Error', 'Password must be at least 6 characters');
                return;
            }
        }

        try {
            setSaving(true);

            if (editingUser) {
                // Update existing user
                await updateSubUser(editingUser.id, {
                    full_name: fullName.trim(),
                    phone: phone.trim(),
                    is_active: isActive
                });
                Alert.alert('Success', 'User updated successfully');
            } else {
                // Create new user
                const newUserData: CreateSubUserData = {
                    email: email.trim().toLowerCase(),
                    password: password,
                    full_name: fullName.trim(),
                    phone: phone.trim() || undefined
                };
                await createSubUser(newUserData);
                Alert.alert('Success', 'User created successfully');
            }

            setModalVisible(false);
            loadUsers();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to save user');
        } finally {
            setSaving(false);
        }
    };

    // Delete user
    const handleDeleteUser = (user: SubUser) => {
        Alert.alert(
            'Delete User',
            `Are you sure you want to delete ${user.full_name}? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteSubUser(user.id);
                            Alert.alert('Success', 'User deleted successfully');
                            loadUsers();
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to delete user');
                        }
                    }
                }
            ]
        );
    };

    // Reset user password
    const handleResetPassword = (user: SubUser) => {
        Alert.alert(
            'Reset Password',
            `Generate a new temporary password for ${user.full_name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    onPress: async () => {
                        try {
                            const tempPassword = await resetSubUserPassword(user.id);
                            Alert.alert(
                                'Password Reset',
                                `New temporary password: ${tempPassword}\n\nPlease share this with the user securely.`,
                                [
                                    { text: 'OK' }
                                ]
                            );
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to reset password');
                        }
                    }
                }
            ]
        );
    };

    // Toggle active status
    const handleToggleActive = async (user: SubUser) => {
        try {
            await updateSubUser(user.id, { is_active: !user.is_active });
            loadUsers();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update user status');
        }
    };

    // Render user item
    const renderUserItem = ({ item }: { item: SubUser }) => (
        <View style={styles.userCard}>
            <View style={styles.userHeader}>
                <View style={styles.userIcon}>
                    <MaterialCommunityIcons 
                        name={item.is_active ? "account-check" : "account-off"} 
                        size={32} 
                        color={item.is_active ? "#4CAF50" : "#9E9E9E"} 
                    />
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.full_name}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                    {item.phone && (
                        <Text style={styles.userPhone}>📱 {item.phone}</Text>
                    )}
                    <View style={styles.statusBadge}>
                        <Text style={[
                            styles.statusText,
                            { color: item.is_active ? '#4CAF50' : '#F44336' }
                        ]}>
                            {item.is_active ? 'Active' : 'Inactive'}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.userActions}>
                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleEditUser(item)}
                >
                    <MaterialCommunityIcons name="pencil" size={20} color="#667eea" />
                    <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleResetPassword(item)}
                >
                    <MaterialCommunityIcons name="lock-reset" size={20} color="#FF9800" />
                    <Text style={styles.actionButtonText}>Reset</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleToggleActive(item)}
                >
                    <MaterialCommunityIcons 
                        name={item.is_active ? "pause-circle" : "play-circle"} 
                        size={20} 
                        color={item.is_active ? "#9E9E9E" : "#4CAF50"} 
                    />
                    <Text style={styles.actionButtonText}>
                        {item.is_active ? 'Disable' : 'Enable'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleDeleteUser(item)}
                >
                    <MaterialCommunityIcons name="delete" size={20} color="#F44336" />
                    <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
            </View>

            {item.last_login && (
                <Text style={styles.lastLogin}>
                    Last login: {new Date(item.last_login).toLocaleDateString()}
                </Text>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading users...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Purple Gradient Header - Updated Theme */}
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.headerGradient, { paddingTop: insets.top + 8 }]}
            >
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.headerGreeting}>Team Members</Text>
                        <Text style={styles.headerSubtitle}>{users.length} team member{users.length !== 1 ? 's' : ''}</Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.addButton}
                        onPress={handleAddUser}
                    >
                        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Stats Cards Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <MaterialCommunityIcons name="account-multiple" size={24} color="#FFD93D" />
                        <Text style={styles.statNumber}>{users.length}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statCard}>
                        <MaterialCommunityIcons name="account-check" size={24} color="#6BCF7F" />
                        <Text style={styles.statNumber}>{users.filter(u => u.is_active).length}</Text>
                        <Text style={styles.statLabel}>Active</Text>
                    </View>
                    <View style={styles.statCard}>
                        <MaterialCommunityIcons name="account-off" size={24} color="#FF6B6B" />
                        <Text style={styles.statNumber}>{users.filter(u => !u.is_active).length}</Text>
                        <Text style={styles.statLabel}>Inactive</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Users List */}
            {users.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="account-group-outline" size={80} color="#ccc" />
                    <Text style={styles.emptyText}>No team members yet</Text>
                    <Text style={styles.emptySubtext}>
                        Add users to collaborate on projects
                    </Text>
                    <TouchableOpacity 
                        style={styles.emptyButton}
                        onPress={handleAddUser}
                    >
                        <Text style={styles.emptyButtonText}>Add First Member</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(item) => item.id}
                    renderItem={renderUserItem}
                    contentContainerStyle={styles.listContent}
                />
            )}

            {/* Add/Edit User Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>
                                    {editingUser ? 'Edit User' : 'Add New User'}
                                </Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <MaterialCommunityIcons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>

                            {/* Email (only for new users) */}
                            {!editingUser && (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Email *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={email}
                                        onChangeText={setEmail}
                                        placeholder="user@example.com"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            )}

                            {/* Password (only for new users) */}
                            {!editingUser && (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Password *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={password}
                                        onChangeText={setPassword}
                                        placeholder="Minimum 6 characters"
                                        secureTextEntry
                                    />
                                </View>
                            )}

                            {/* Full Name */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Full Name *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={fullName}
                                    onChangeText={setFullName}
                                    placeholder="John Doe"
                                />
                            </View>

                            {/* Phone */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Phone</Text>
                                <TextInput
                                    style={styles.input}
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="+1234567890"
                                    keyboardType="phone-pad"
                                />
                            </View>

                            {/* Active Status (only for editing) */}
                            {editingUser && (
                                <View style={styles.inputGroup}>
                                    <View style={styles.switchRow}>
                                        <Text style={styles.inputLabel}>Active Status</Text>
                                        <Switch
                                            value={isActive}
                                            onValueChange={setIsActive}
                                            trackColor={{ false: '#ccc', true: '#4CAF50' }}
                                        />
                                    </View>
                                    <Text style={styles.helpText}>
                                        Inactive users cannot login or access data
                                    </Text>
                                </View>
                            )}

                            {/* Buttons */}
                            <View style={styles.modalButtons}>
                                <TouchableOpacity 
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.modalButton, styles.saveButton]}
                                    onPress={handleSaveUser}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.saveButtonText}>
                                            {editingUser ? 'Update' : 'Create'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f7fa',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    headerGradient: {
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        elevation: 8,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    headerGreeting: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.9)',
    },
    addButton: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
    },
    statCard: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
    },
    listContent: {
        padding: 20,
        paddingTop: 24,
    },
    userCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    userHeader: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    userIcon: {
        marginRight: 12,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    userPhone: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    statusBadge: {
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    userActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    actionButton: {
        alignItems: 'center',
        padding: 8,
    },
    actionButtonText: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    lastLogin: {
        fontSize: 11,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#666',
        marginTop: 20,
    },
    emptySubtext: {
        fontSize: 15,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
    },
    emptyButton: {
        backgroundColor: '#667eea',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 28,
        elevation: 3,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    emptyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: '90%',
        padding: 28,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 28,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#667eea',
    },
    inputGroup: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    input: {
        borderWidth: 1.5,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#fafafa',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    helpText: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 14,
        marginTop: 32,
    },
    modalButton: {
        flex: 1,
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 17,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#667eea',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
    },
});
