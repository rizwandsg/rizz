import { database } from '../services/databaseService';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
    id: string;
    email: string;
    full_name: string;
    created_at: string;
    last_login?: string;
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
        
        // Create new user
        const newUser = {
            email: data.email,
            password_hash: passwordHash,
            full_name: data.full_name,
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
        // Hash the password
        const passwordHash = await hashPassword(credentials.password);

        // Find user by email and password
        const users = await database.loadData<any>('users', {
            filter: `email.eq.${credentials.email},password_hash.eq.${passwordHash}`
        });

        if (!users || users.length === 0) {
            throw new Error('Invalid email or password');
        }

        const user = users[0];

        // Update last login
        await database.upsertData('users', {
            id: user.id,
            last_login: new Date().toISOString()
        });

        // Remove password_hash from user object
        const { password_hash, ...userWithoutPassword } = user;

        // Store user data locally
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userWithoutPassword));
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, user.id);

        return userWithoutPassword;
    } catch (error) {
        console.error('Login error:', error);
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