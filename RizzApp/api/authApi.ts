import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../services/databaseService';
import { requireAccessToken, supabase } from '../services/supabaseClient';

export interface User {
    id: string;
    clerk_user_id?: string; // Clerk user ID for users authenticated via Clerk
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


let currentUser: User | null = null;
let revision = 0;
let cacheQueue: Promise<void> = Promise.resolve();
function queueCache(operation: () => Promise<void>) {
    const pending = cacheQueue.catch(() => {}).then(operation);
    cacheQueue = pending;
    return pending;
}
const listeners = new Set<() => void>();
export function subscribeToSession(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function sessionRevision() { return revision; }
export function getSessionUser(): User | null { return currentUser; }
function changed() { revision++; listeners.forEach(listener => listener()); }
export async function clearSessionUser() {
    currentUser = null;
    changed();
    await queueCache(() => AsyncStorage.multiRemove(['@rizzapp_user', '@rizzapp_token', '@rizzapp_projects', '@rizzapp_expenses']));
}
async function account<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
    const token = await requireAccessToken();
    const { data, error } = await supabase.functions.invoke('account', { body: { action, ...payload }, headers: { Authorization: 'Bearer ' + token } });
    if (error) throw new Error('Account service failed. Please retry or contact your workspace owner.');
    if (data?.error) throw new Error(data.error);
    return data as T;
}
export async function refreshCurrentUser(): Promise<User> {
    const started = revision;
    const user = await account<User>('sync');
    if (started !== revision) throw new Error('Session changed while loading the account');
    if (!user.id || !user.clerk_user_id || !user.is_active || !['owner', 'member'].includes(user.role || '')) throw new Error('This account is inactive or has not been migrated');
    currentUser = user;
    changed();
    const committed = revision;
    // Cached profile is display data only. It never establishes authentication.
    await queueCache(async () => {
        if (committed !== revision) return;
        await AsyncStorage.setItem('@rizzapp_user', JSON.stringify(user));
        await AsyncStorage.removeItem('@rizzapp_token');
    });
    if (committed !== revision) throw new Error('Session changed while loading the account');
    return user;
}
export async function getCurrentUser(): Promise<User | null> {
    try { await requireAccessToken(); return currentUser; } catch { return null; }
}
export const getCurrentUserWithClerk = getCurrentUser;
export async function isAuthenticated() { return !!(await getCurrentUser()); }
export const logout = clearSessionUser;

// Legacy local-password entry points fail closed; all sign-in uses Clerk.
export async function login(_credentials: LoginCredentials): Promise<User> { throw new Error('Sign in through the secure sign-in screen'); }
export async function signup(_data: SignupData): Promise<User> { throw new Error('Create your account through the verified sign-up screen'); }
export async function changePassword(_email: string, _currentPassword: string, _newPassword: string): Promise<void> { throw new Error('Change your password through your signed-in Clerk account'); }
export async function resetPassword(_email: string): Promise<string> { throw new Error('Use Forgot password to verify your email and reset your password'); }
export async function updateProfile(data: { full_name?: string; phone?: string }): Promise<User> {
    const started = revision;
    const identity = currentUser;
    if (!identity) throw new Error('Please sign in again');
    const result = await account<User>('updateProfile', { profile: data });
    if (started !== revision) throw new Error('Session changed while updating the profile');
    if (!result || result.id !== identity.id || result.clerk_user_id !== identity.clerk_user_id || !result.is_active || result.role !== identity.role || result.parent_user_id !== identity.parent_user_id) throw new Error('Profile identity changed. Please sign in again');
    currentUser = result; changed();
    const committed = revision;
    await queueCache(async () => {
        if (committed === revision) await AsyncStorage.setItem('@rizzapp_user', JSON.stringify(result));
    });
    if (committed !== revision) throw new Error('Session changed while updating the profile');
    return result;
}
export async function createSubUser(data: CreateSubUserData): Promise<SubUser> { return account('createMember', { member: data }); }
export async function getSubUsers(): Promise<SubUser[]> {
    const user = await getCurrentUser();
    if (user?.role !== 'owner' || user.parent_user_id) throw new Error('Only workspace owners can manage team members');
    return database.loadData<SubUser>('users', { filter: 'parent_user_id.eq.' + user.id, order: 'created_at.desc' });
}
export async function updateSubUser(id: string, data: { full_name?: string; phone?: string; is_active?: boolean }): Promise<SubUser> { return account('updateMember', { id, member: data }); }
export async function deleteSubUser(id: string): Promise<void> { await account('deactivateMember', { id }); }
export async function resetSubUserPassword(_id: string): Promise<void> { throw new Error('Team members must use Forgot password with their verified email address'); }
export async function getSupabaseUserFromClerk(clerkUserId: string): Promise<User | null> {
    const users = await database.loadData<User>('users', { filter: 'clerk_user_id.eq.' + clerkUserId });
    return users[0] ?? null;
}
export async function syncClerkUserToSupabase(_clerkUserId: string, _email: string, _fullName: string): Promise<User> { return refreshCurrentUser(); }
export async function updateClerkUserLastLogin(_clerkUserId: string): Promise<void> { await refreshCurrentUser(); }
