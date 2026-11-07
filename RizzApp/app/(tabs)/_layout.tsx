import { canManageMembers } from '../../services/routePolicy';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAccount } from '../../context/AuthContext';
import { registerForPushNotificationsAsync } from "../../services/notificationService";
import { subscribeToAll, unsubscribeFromAll, WebSocketCallbacks } from "../../services/websocketService";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAccount();

  // Initialize push notifications on mount
  useEffect(() => {
    registerForPushNotificationsAsync().catch((error) => {
      console.error('❌ Failed to register push notifications:', error);
    });
  }, []);

  // Setup WebSocket subscriptions when user is loaded
  useEffect(() => {
    if (!currentUser) return;

    const callbacks: WebSocketCallbacks = {
      onError: (error) => {
        console.error('❌ WebSocket error:', error);
      },
    };

    // Subscribe to real-time updates
    subscribeToAll(callbacks).catch((error) => {
      console.error('❌ Failed to subscribe to WebSocket:', error);
    });

    // Cleanup on unmount
    return () => {
      unsubscribeFromAll().catch((error) => {
        console.error('❌ Failed to unsubscribe from WebSocket:', error);
      });
    };
  }, [currentUser]);

  // Check if user is an owner (not a sub-user)
  const isOwner = canManageMembers(currentUser);
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#8E8E93",
        tabBarStyle: { 
          backgroundColor: "#fff", 
          borderTopWidth: 1,
          borderTopColor: "#E5E5EA",
          paddingTop: 8,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          height: 60 + (insets.bottom > 0 ? insets.bottom : 0),
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Projects",
          tabBarIcon: ({ color, size }) => <Ionicons name="briefcase" size={size} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="expense"
        options={{
          title: "Expenses",
          tabBarIcon: ({ color, size }) => <Ionicons name="cash" size={size} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Protected guard={isOwner}>
      <Tabs.Screen
        name="users"
        options={{
          title: "Users",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-group" size={size} color={color} />,
          headerShown: false,
        }}
      />
      </Tabs.Protected>
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
