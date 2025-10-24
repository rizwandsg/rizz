import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Tabs } from "expo-router";
import React, { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getCurrentUser, User } from "../../api/authApi";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load user on mount and whenever tabs gain focus
  useFocusEffect(
    React.useCallback(() => {
      let interval: NodeJS.Timeout | null = null;
      
      const loadUser = async () => {
        const user = await getCurrentUser();
        setCurrentUser(user);
        console.log('👤 Tabs Layout - Current User:', user?.email, 'Role:', user?.role);
        
        // If user not found, start polling
        if (!user) {
          interval = setInterval(async () => {
            const polledUser = await getCurrentUser();
            if (polledUser) {
              setCurrentUser(polledUser);
              console.log('👤 Tabs Layout - User loaded after poll:', polledUser?.email, 'Role:', polledUser?.role);
              if (interval) clearInterval(interval);
            }
          }, 1000);
          
          // Clean up interval after 10 seconds
          setTimeout(() => {
            if (interval) clearInterval(interval);
          }, 10000);
        }
      };
      loadUser();
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }, [])
  );

  // Check if user is an owner (not a sub-user)
  const isOwner = currentUser && (!currentUser.parent_user_id || currentUser.role === 'owner');
  console.log('🔑 Tabs Layout - Is Owner:', isOwner, 'User Role:', currentUser?.role);
  
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
      <Tabs.Screen
        name="users"
        options={{
          title: "Users",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-group" size={size} color={color} />,
          headerShown: false,
          href: isOwner ? '/users' : null,
        }}
      />
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
