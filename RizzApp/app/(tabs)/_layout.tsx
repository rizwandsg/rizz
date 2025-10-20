import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: "#1c1c1e",
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#8E8E93",
        tabBarStyle: { 
          backgroundColor: "#fff", 
          borderTopWidth: 1,
          borderTopColor: "#E5E5EA",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
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
