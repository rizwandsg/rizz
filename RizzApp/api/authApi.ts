import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { database } from '../services/databaseService';

export interface User {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
    created_at: string;
    updated_at?: string;
    last_login?: string;
    parent_user_id?: string | null;
    role?: 'owner' | 'member';
    is_active?: boolean;
}

export interface SubUser {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
    role: 'member';
    is_active: boolean;
    parent_user_id: string;
    created_at: string;
    last_login?: string;
}

export interface CreateSubUserData {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignupData {
    email: string;
    password: string;
    full_name: string;
}

const USER_STORAGE_KEY = '@rizzapp_user';
const TOKEN_STORAGE_KEY = '@rizzapp_token';

/**
 * Hash password using SHA256
 */
const hashPassword = async (password: string): Promise<string> => {
    return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password
    );
};

/**
 * Sign up a new user
 */
export const signup = async (data: SignupData): Promise<User> => {
    try {
        console.log('Starting signup process for:', data.email);
        
        // Hash the password
        const passwordHash = await hashPassword(data.password);
        console.log('Password hashed successfully');

        // Check if user already exists
        const existingUser = await database.loadData<User>('users', {
            filter: `email.eq.${data.email}`
        });

        if (existingUser && existingUser.length > 0) {
            throw new Error('User with this email already exists');
        }

        console.log('Creating new user...');
        
        // Create new user (signup always creates an owner account)
        const newUser = {
            email: data.email,
            password_hash: passwordHash,
            full_name: data.full_name,
            role: 'owner', // New signups are always owners
            is_active: true,
            parent_user_id: null
        };

        const createdUser = await database.saveData('users', newUser);
        console.log('User created:', createdUser);

        // Remove password_hash from the user object before storing
        const { password_hash, ...userWithoutPassword } = createdUser as any;

        // Store user data locally
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userWithoutPassword));
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, userWithoutPassword.id);

        return userWithoutPassword as User;
    } catch (error) {
        console.error('Signup error:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to create user');
    }
};

/**
 * Login user
 */
export const login = async (credentials: LoginCredentials): Promise<User> => {
    try {
        console.log('🔐 Login attempt for email:', credentials.email);
        
        // Hash the password
        const passwordHash = await hashPassword(credentials.password);
        console.log('🔑 Password hashed:', passwordHash.substring(0, 10) + '...');

        // Get ALL users and filter in JavaScript (workaround for email filter issue with dots)
        const allUsers = await database.loadData<any>('users');
        console.log('📊 Total users loaded:', allUsers?.length || 0);

        // Filter by email and password in JavaScript
        const users = allUsers?.filter(u => 
            u.email.toLowerCase() === credentials.email.toLowerCase() && 
            u.password_hash === passwordHash
        ) || [];

        console.log('👥 Users matching credentials:', users.length);

        if (users.length === 0) {
            // Check if email exists
            const emailExists = allUsers?.some(u => u.email.toLowerCase() === credentials.email.toLowerCase());
            
            if (!emailExists) {
                console.log('❌ Email not found in database');
                throw new Error('Invalid email or password');
            } else {
                console.log('❌ Email found but password incorrect');
                throw new Error('Invalid email or password');
            }
        }

        const user = users[0];
        console.log('✅ Login successful for user:', user.full_name);

        // If user doesn't have role set, set it to 'owner' (for existing users)
        if (!user.role || (user.role !== 'owner' && user.role !== 'member')) {
            console.log('⚠️ User missing role, setting to owner');
            await database.updateData('users', user.id, {
                role: 'owner',
                is_active: true,
                parent_user_id: null,
                last_login: new Date().toISOString()
            });
            user.role = 'owner';
            user.is_active = true;
            user.parent_user_id = null;
        } else {
            // Update last login only
            await database.updateData('users', user.id, {
                last_login: new Date().toISOString()
            });
        }

        console.log('👤 User role:', user.role);

        // Remove password_hash from user object
        const { password_hash, ...userWithoutPassword } = user;

        // Store user data locally
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userWithoutPassword));
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, user.id);

        return userWithoutPassword;
    } catch (error) {
        console.error('❌ Login error:', error);
        throw error;
    }
};

/**
 * Logout user
 */
export const logout = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch (error) {
        console.error('Logout error:', error);
        throw error;
    }
};

/**
 * Get current logged in user
 */
export const getCurrentUser = async (): Promise<User | null> => {
    try {
        const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('Get current user error:', error);
        return null;
    }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
    try {
        const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        return !!token;
    } catch (error) {
        console.error('Authentication check error:', error);
        return false;
    }
};

/**
 * Reset password - Generates a temporary password
 * Returns the temporary password (in production, this would be emailed)
 */
export const resetPassword = async (email: string): Promise<string> => {
    try {
        console.log('🔄 Starting password reset for:', email);
        
        // Get ALL users and filter in JavaScript (workaround for email.eq filter issue with dots)
        const allUsers = await database.loadData<User>('users');
        
        console.log('📊 Total users in database:', allUsers?.length || 0);
        
        // Filter by email in JavaScript
        const users = allUsers?.filter(u => u.email.toLowerCase() === email.toLowerCase()) || [];
        
        console.log('📊 Users matching email:', users.length);
        
        if (users.length === 0) {
            console.log('❌ No users found with email:', email);
            throw new Error('No account found with this email address');
        }

        const user = users[0];
        
        // Generate a temporary password (6 digits)
        const tempPassword = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Hash the temporary password
        const passwordHash = await hashPassword(tempPassword);
        
        // Update user's password in database
        await database.updateData('users', user.id, {
            password_hash: passwordHash,
            updated_at: new Date().toISOString()
        });

        console.log('🔑 Temporary password generated:', tempPassword);
        console.log('✅ Password reset completed successfully');
        
        // Return the temporary password so it can be shown to user
        // In production, this would be sent via email instead
        return tempPassword;
    } catch (error: any) {
        console.error('❌ Reset password error:', error);
        console.error('Error message:', error.message);
        throw error;
    }
};

/**
 * Update user profile - COMPLETELY REWRITTEN 2025-10-22 15:30:00
 * This function ONLY modifies full_name and phone fields
 * Email field is NEVER touched to prevent NOT NULL violations
 */
export const updateProfile = async (profileData: { full_name?: string; phone?: string }): Promise<User> => {
    console.log('�🔥🔥 NEW updateProfile function executing!', profileData);
    
    const user = await getCurrentUser();
    if (!user) throw new Error('User not logged in');

    console.log('Current user email:', user.email, 'ID:', user.id);

    // Prepare ONLY the fields to update
    const fieldsToUpdate: Record<string, any> = {
        updated_at: new Date().toISOString()
    };
    
    if (profileData.full_name?.trim()) {
        fieldsToUpdate.full_name = profileData.full_name.trim();
        console.log('Will update full_name to:', fieldsToUpdate.full_name);
    }
    
    if (profileData.phone !== undefined) {
        fieldsToUpdate.phone = profileData.phone.trim() || null;
        console.log('Will update phone to:', fieldsToUpdate.phone);
    }

    console.log('🎯🎯🎯 About to call database.updateData with:', fieldsToUpdate);

    try {
        // Call updateData (NOT upsertData!)
        const result = await database.updateData<User>('users', user.id, fieldsToUpdate);
        
        console.log('✅✅✅ SUCCESS! Database returned:', result);

        // Save to local storage
        const updatedUserData: User = { ...user, ...result, email: user.email };
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUserData));

        console.log('💾💾💾 Saved to AsyncStorage successfully');
        return updatedUserData;
    } catch (err: any) {
        console.error('❌❌❌ ERROR in updateProfile:', err);
        console.error('Error message:', err.message);
        console.error('Error code:', err.code);
        throw new Error(`Profile update failed: ${err.message}`);
    }
};

// =====================================================
// SUB-USER MANAGEMENT FUNCTIONS
// =====================================================

/**
 * Create a sub-user (team member)
 * Only owners can create sub-users
 */
export const createSubUser = async (data: CreateSubUserData): Promise<SubUser> => {
    try {
        console.log('👥 Creating sub-user:', data.email);
        
        const currentUser = await getCurrentUser();
        if (!currentUser) throw new Error('User not logged in');
        
        console.log('👤 Current user role:', currentUser.role, 'parent_user_id:', currentUser.parent_user_id);
        
        // Only owners can create sub-users (role must be 'owner' and no parent)
        if (currentUser.role !== 'owner' || currentUser.parent_user_id) {
            throw new Error('Only owner accounts can create team members');
        }

        // Hash the password
        const passwordHash = await hashPassword(data.password);

        // Check if email already exists
        const allUsers = await database.loadData<User>('users');
        const emailExists = allUsers?.some(u => u.email.toLowerCase() === data.email.toLowerCase());
        
        if (emailExists) {
            throw new Error('User with this email already exists');
        }

        // Create sub-user
        const newSubUser = {
            email: data.email.toLowerCase(),
            password_hash: passwordHash,
            full_name: data.full_name,
            phone: data.phone || null,
            parent_user_id: currentUser.id,
            role: 'member',
            is_active: true
        };

        const createdUser = await database.saveData('users', newSubUser);
        console.log('✅ Sub-user created:', createdUser);

        // Remove password_hash
        const { password_hash, ...subUserWithoutPassword } = createdUser as any;
        return subUserWithoutPassword as SubUser;
    } catch (error) {
        console.error('❌ Create sub-user error:', error);
        throw error;
    }
};

/**
 * Get all sub-users for the current owner
 */
export const getSubUsers = async (): Promise<SubUser[]> => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) throw new Error('User not logged in');

        console.log('📋 Loading sub-users for:', currentUser.email);

        // Load all users and filter for sub-users
        const allUsers = await database.loadData<any>('users');
        const subUsers = allUsers?.filter(u => 
            u.parent_user_id === currentUser.id
        ) || [];

        console.log('✅ Found', subUsers.length, 'sub-users');

        // Remove password_hash from all
        return subUsers.map(({ password_hash, ...user }) => user as SubUser);
    } catch (error) {
        console.error('❌ Get sub-users error:', error);
        throw error;
    }
};

/**
 * Update sub-user details
 * Only owners can update their sub-users
 */
export const updateSubUser = async (
    subUserId: string, 
    data: { full_name?: string; phone?: string; is_active?: boolean }
): Promise<SubUser> => {
    try {
        console.log('✏️ Updating sub-user:', subUserId);
        
        const currentUser = await getCurrentUser();
        if (!currentUser) throw new Error('User not logged in');

        // Verify the sub-user belongs to this owner
        const allUsers = await database.loadData<any>('users');
        const subUser = allUsers?.find(u => u.id === subUserId && u.parent_user_id === currentUser.id);
        
        if (!subUser) {
            throw new Error('Sub-user not found or access denied');
        }

        // Prepare update data
        const updateData: Record<string, any> = {
            updated_at: new Date().toISOString()
        };
        
        if (data.full_name) updateData.full_name = data.full_name;
        if (data.phone !== undefined) updateData.phone = data.phone || null;
        if (data.is_active !== undefined) updateData.is_active = data.is_active;

        const updated = await database.updateData('users', subUserId, updateData);
        console.log('✅ Sub-user updated');

        const { password_hash, ...updatedWithoutPassword } = updated as any;
        return updatedWithoutPassword as SubUser;
    } catch (error) {
        console.error('❌ Update sub-user error:', error);
        throw error;
    }
};

/**
 * Delete a sub-user
 * Only owners can delete their sub-users
 */
export const deleteSubUser = async (subUserId: string): Promise<void> => {
    try {
        console.log('🗑️ Deleting sub-user:', subUserId);
        
        const currentUser = await getCurrentUser();
        if (!currentUser) throw new Error('User not logged in');

        // Verify the sub-user belongs to this owner
        const allUsers = await database.loadData<any>('users');
        const subUser = allUsers?.find(u => u.id === subUserId && u.parent_user_id === currentUser.id);
        
        if (!subUser) {
            throw new Error('Sub-user not found or access denied');
        }

        await database.deleteData('users', subUserId);
        console.log('✅ Sub-user deleted');
    } catch (error) {
        console.error('❌ Delete sub-user error:', error);
        throw error;
    }
};

/**
 * Reset sub-user password
 * Generates a temporary password
 */
export const resetSubUserPassword = async (subUserId: string): Promise<string> => {
    try {
        console.log('🔄 Resetting password for sub-user:', subUserId);
        
        const currentUser = await getCurrentUser();
        if (!currentUser) throw new Error('User not logged in');

        // Verify the sub-user belongs to this owner
        const allUsers = await database.loadData<any>('users');
        const subUser = allUsers?.find(u => u.id === subUserId && u.parent_user_id === currentUser.id);
        
        if (!subUser) {
            throw new Error('Sub-user not found or access denied');
        }

        // Generate temporary password (6 digits)
        const tempPassword = Math.floor(100000 + Math.random() * 900000).toString();
        const passwordHash = await hashPassword(tempPassword);

        await database.updateData('users', subUserId, {
            password_hash: passwordHash,
            updated_at: new Date().toISOString()
        });

        console.log('✅ Password reset for sub-user');
        return tempPassword;
    } catch (error) {
        console.error('❌ Reset sub-user password error:', error);
        throw error;
    }
};
