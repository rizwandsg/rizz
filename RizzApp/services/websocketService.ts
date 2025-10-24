/**
 * WebSocket Service for Real-time Updates
 * Handles real-time communication for projects, expenses, and payments
 */

import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { getCurrentUser } from '../api/authApi';
import { NotificationType, sendAppNotification } from './notificationService';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

// Create Supabase client for realtime
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Store active channels
const activeChannels: Map<string, RealtimeChannel> = new Map();

export interface RealtimeEvent {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    table: string;
    new: any;
    old: any;
}

export interface WebSocketCallbacks {
    onProjectCreated?: (project: any) => void;
    onProjectUpdated?: (project: any) => void;
    onProjectDeleted?: (project: any) => void;
    onExpenseCreated?: (expense: any) => void;
    onExpenseUpdated?: (expense: any) => void;
    onExpenseDeleted?: (expense: any) => void;
    onPaymentCreated?: (payment: any) => void;
    onPaymentUpdated?: (payment: any) => void;
    onError?: (error: Error) => void;
}

/**
 * Subscribe to real-time updates for projects
 */
export async function subscribeToProjects(
    userId: string,
    callbacks: WebSocketCallbacks
): Promise<void> {
    try {
        const channelName = `projects:${userId}`;
        
        // Remove existing channel if any
        if (activeChannels.has(channelName)) {
            await unsubscribeFromChannel(channelName);
        }

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'projects',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    console.log('🔔 New project created:', payload.new);
                    callbacks.onProjectCreated?.(payload.new);
                    
                    // Send notification
                    sendAppNotification(NotificationType.PROJECT_CREATED, {
                        projectName: payload.new.name,
                        projectId: payload.new.id,
                    }).catch(console.error);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'projects',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    console.log('🔔 Project updated:', payload.new);
                    callbacks.onProjectUpdated?.(payload.new);
                    
                    // Send notification if status changed to completed
                    if (payload.new.status === 'completed' && payload.old.status !== 'completed') {
                        sendAppNotification(NotificationType.PROJECT_COMPLETED, {
                            projectName: payload.new.name,
                            projectId: payload.new.id,
                        }).catch(console.error);
                    } else {
                        sendAppNotification(NotificationType.PROJECT_UPDATED, {
                            projectName: payload.new.name,
                            projectId: payload.new.id,
                        }).catch(console.error);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'projects',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    console.log('🔔 Project deleted:', payload.old);
                    callbacks.onProjectDeleted?.(payload.old);
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Subscribed to projects channel');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ Error subscribing to projects channel');
                    callbacks.onError?.(new Error('Failed to subscribe to projects'));
                }
            });

        activeChannels.set(channelName, channel);
    } catch (error) {
        console.error('❌ Error subscribing to projects:', error);
        callbacks.onError?.(error as Error);
    }
}

/**
 * Subscribe to real-time updates for expenses
 */
export async function subscribeToExpenses(
    userId: string,
    callbacks: WebSocketCallbacks
): Promise<void> {
    try {
        const channelName = `expenses:${userId}`;
        
        // Remove existing channel if any
        if (activeChannels.has(channelName)) {
            await unsubscribeFromChannel(channelName);
        }

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'expenses',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    console.log('🔔 New expense created:', payload.new);
                    callbacks.onExpenseCreated?.(payload.new);
                    
                    // Send notification
                    sendAppNotification(NotificationType.EXPENSE_ADDED, {
                        expenseAmount: payload.new.amount,
                        expenseId: payload.new.id,
                        description: payload.new.description,
                    }).catch(console.error);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'expenses',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    console.log('🔔 Expense updated:', payload.new);
                    callbacks.onExpenseUpdated?.(payload.new);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'expenses',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    console.log('🔔 Expense deleted:', payload.old);
                    callbacks.onExpenseDeleted?.(payload.old);
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Subscribed to expenses channel');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ Error subscribing to expenses channel');
                    callbacks.onError?.(new Error('Failed to subscribe to expenses'));
                }
            });

        activeChannels.set(channelName, channel);
    } catch (error) {
        console.error('❌ Error subscribing to expenses:', error);
        callbacks.onError?.(error as Error);
    }
}

/**
 * Subscribe to all real-time updates for a user
 */
export async function subscribeToAll(callbacks: WebSocketCallbacks): Promise<void> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        console.log('🔌 Subscribing to real-time updates for user:', user.email);
        
        // Subscribe to projects and expenses
        await Promise.all([
            subscribeToProjects(user.id, callbacks),
            subscribeToExpenses(user.id, callbacks),
        ]);

        console.log('✅ Subscribed to all real-time updates');
    } catch (error) {
        console.error('❌ Error subscribing to real-time updates:', error);
        callbacks.onError?.(error as Error);
    }
}

/**
 * Unsubscribe from a specific channel
 */
export async function unsubscribeFromChannel(channelName: string): Promise<void> {
    try {
        const channel = activeChannels.get(channelName);
        if (channel) {
            await supabase.removeChannel(channel);
            activeChannels.delete(channelName);
            console.log('✅ Unsubscribed from channel:', channelName);
        }
    } catch (error) {
        console.error('❌ Error unsubscribing from channel:', error);
    }
}

/**
 * Unsubscribe from all active channels
 */
export async function unsubscribeFromAll(): Promise<void> {
    try {
        console.log('🔌 Unsubscribing from all channels...');
        
        const promises = Array.from(activeChannels.keys()).map((channelName) =>
            unsubscribeFromChannel(channelName)
        );
        
        await Promise.all(promises);
        activeChannels.clear();
        
        console.log('✅ Unsubscribed from all channels');
    } catch (error) {
        console.error('❌ Error unsubscribing from all channels:', error);
    }
}

/**
 * Get connection status
 */
export function getConnectionStatus(): {
    isConnected: boolean;
    activeChannels: number;
    channelNames: string[];
} {
    return {
        isConnected: activeChannels.size > 0,
        activeChannels: activeChannels.size,
        channelNames: Array.from(activeChannels.keys()),
    };
}

/**
 * Broadcast a custom event to other connected clients
 */
export async function broadcastEvent(
    channelName: string,
    eventName: string,
    payload: any
): Promise<void> {
    try {
        const channel = activeChannels.get(channelName);
        if (!channel) {
            throw new Error(`Channel ${channelName} not found`);
        }

        await channel.send({
            type: 'broadcast',
            event: eventName,
            payload,
        });

        console.log('✅ Event broadcasted:', eventName);
    } catch (error) {
        console.error('❌ Error broadcasting event:', error);
        throw error;
    }
}

/**
 * Listen for custom broadcast events
 */
export function listenToBroadcast(
    channelName: string,
    eventName: string,
    callback: (payload: any) => void
): void {
    try {
        const channel = activeChannels.get(channelName);
        if (!channel) {
            throw new Error(`Channel ${channelName} not found`);
        }

        channel.on('broadcast', { event: eventName }, ({ payload }) => {
            console.log('🔔 Broadcast received:', eventName, payload);
            callback(payload);
        });

        console.log('✅ Listening to broadcast:', eventName);
    } catch (error) {
        console.error('❌ Error listening to broadcast:', error);
    }
}
