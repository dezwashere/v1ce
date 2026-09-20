import { Redirect, Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";

export default function TabsLayout() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Redirect href="/sign-in" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#F5A41A",
        tabBarInactiveTintColor: "#737373",
        tabBarStyle: { height: 64, paddingTop: 6, backgroundColor: "#FFFFFF", borderTopWidth: 2, borderTopColor: "#E0E0E0" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color, size }) => <Feather name="home" color={color} size={size} /> }} />
      <Tabs.Screen name="customize" options={{ title: "Coin", tabBarIcon: ({ color, size }) => <Feather name="circle" color={color} size={size} /> }} />
      <Tabs.Screen name="analytics" options={{ title: "Stats", tabBarIcon: ({ color, size }) => <Feather name="bar-chart-2" color={color} size={size} /> }} />
      <Tabs.Screen name="lounge" options={{ title: "Lounge", tabBarIcon: ({ color, size }) => <Feather name="users" color={color} size={size} /> }} />
      <Tabs.Screen name="friends" options={{ title: "Friends", tabBarIcon: ({ color, size }) => <Feather name="user-plus" color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, size }) => <Feather name="settings" color={color} size={size} /> }} />
      <Tabs.Screen name="premium" options={{ title: "Premium", tabBarIcon: ({ color, size }) => <Feather name="star" color={color} size={size} /> }} />
    </Tabs>
  );
}
