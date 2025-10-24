/**
 * Custom hooks for WebSocket functionality
 */

import { useEffect, useRef, useState } from 'react';
import { subscribeToAll, unsubscribeFromAll, WebSocketCallbacks, getConnectionStatus } from '../services/websocketService';

/**
 * Hook to manage WebSocket connection with automatic cleanup
 */
export function useWebSocket(callbacks: WebSocketCallbacks) {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const callbacksRef = useRef(callbacks);

    // Update callbacks ref when they change
    useEffect(() => {
        callbacksRef.current = callbacks;
    }, [callbacks]);

    useEffect(() => {
        let mounted = true;

        const wrappedCallbacks: WebSocketCallbacks = {
            ...callbacksRef.current,
            onError: (err) => {
                if (mounted) {
                    setError(err);
                    setIsConnected(false);
                }
                callbacksRef.current.onError?.(err);
            },
        };

        // Subscribe to WebSocket
        subscribeToAll(wrappedCallbacks)
            .then(() => {
                if (mounted) {
                    setIsConnected(true);
                    setError(null);
                }
            })
            .catch((err) => {
                if (mounted) {
                    setError(err);
                    setIsConnected(false);
                }
            });

        // Cleanup on unmount
        return () => {
            mounted = false;
            unsubscribeFromAll().catch(console.error);
        };
    }, []);

    return { isConnected, error };
}

/**
 * Hook to get WebSocket connection status
 */
export function useWebSocketStatus() {
    const [status, setStatus] = useState(getConnectionStatus());

    useEffect(() => {
        const interval = setInterval(() => {
            setStatus(getConnectionStatus());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return status;
}

/**
 * Hook for project updates
 */
export function useProjectUpdates(callbacks: {
    onCreated?: (project: any) => void;
    onUpdated?: (project: any) => void;
    onDeleted?: (project: any) => void;
}) {
    return useWebSocket({
        onProjectCreated: callbacks.onCreated,
        onProjectUpdated: callbacks.onUpdated,
        onProjectDeleted: callbacks.onDeleted,
    });
}

/**
 * Hook for expense updates
 */
export function useExpenseUpdates(callbacks: {
    onCreated?: (expense: any) => void;
    onUpdated?: (expense: any) => void;
    onDeleted?: (expense: any) => void;
}) {
    return useWebSocket({
        onExpenseCreated: callbacks.onCreated,
        onExpenseUpdated: callbacks.onUpdated,
        onExpenseDeleted: callbacks.onDeleted,
    });
}
