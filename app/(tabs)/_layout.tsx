import { BlurView } from "expo-blur";
import { Redirect, Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index"><Icon sf={{ default: "house", selected: "house.fill" }} /><Label>HOME</Label></NativeTabs.Trigger>
      <NativeTabs.Trigger name="customize"><Icon sf={{ default: "circle", selected: "circle.fill" }} /><Label>CUSTOMIZE</Label></NativeTabs.Trigger>
      <NativeTabs.Trigger name="lounge"><Icon sf={{ default: "person.2", selected: "person.2.fill" }} /><Label>LOUNGE</Label></NativeTabs.Trigger>
      <NativeTabs.Trigger name="friends"><Icon sf={{ default: "person.2", selected: "person.2.fill" }} /><Label>FRIENDS</Label></NativeTabs.Trigger>
      <NativeTabs.Trigger name="widget"><Icon sf={{ default: "square.and.arrow.up", selected: "square.and.arrow.up.fill" }} /><Label>SHARE</Label></NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const isDark = useColorScheme() === "dark";
  const isIOS = Platform.OS === "ios";
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.foreground,
      tabBarInactiveTintColor: colors.mutedForeground,
      tabBarStyle: [styles.tabBar,{backgroundColor:isIOS?"transparent":colors.background,borderTopColor:colors.border}],
      tabBarBackground: isIOS ? () => <BlurView intensity={100} tint={isDark?"dark":"light"} style={StyleSheet.absoluteFill}/> : undefined,
    }}>
      <Tabs.Screen name="index" options={{title:"HOME",tabBarIcon:({color})=>isIOS?<SymbolView name="house" tintColor={color} size={24}/>:<Feather name="home" size={22} color={color}/>}}/>
      <Tabs.Screen name="customize" options={{title:"CUSTOMIZE",tabBarIcon:({color})=>isIOS?<SymbolView name="circle" tintColor={color} size={24}/>:<Feather name="circle" size={22} color={color}/>}}/>
      <Tabs.Screen name="lounge" options={{title:"LOUNGE",tabBarIcon:({color})=>isIOS?<SymbolView name="person.2" tintColor={color} size={24}/>:<Feather name="users" size={22} color={color}/>}}/>
      <Tabs.Screen name="friends" options={{title:"FRIENDS",tabBarIcon:({color})=>isIOS?<SymbolView name="person.2" tintColor={color} size={24}/>:<Feather name="users" size={22} color={color}/>}}/>
      <Tabs.Screen name="widget" options={{title:"SHARE",tabBarIcon:({color})=>isIOS?<SymbolView name="square.and.arrow.up" tintColor={color} size={24}/>:<Feather name="share-2" size={22} color={color}/>}}/>
      <Tabs.Screen name="analytics" options={{href:null}}/><Tabs.Screen name="profile" options={{href:null}}/><Tabs.Screen name="premium" options={{href:null}}/>
    </Tabs>
  );
}

export default function TabLayout(){
  const {isLoading,profile}=useAuth();
  if(isLoading)return null;
  if(!profile?.sobriety_date)return <Redirect href="/onboarding"/>;
  return Platform.OS==="ios"?<NativeTabLayout/>:<ClassicTabLayout/>
}
const styles=StyleSheet.create({tabBar:{height:72,paddingTop:6,paddingBottom:8}});
