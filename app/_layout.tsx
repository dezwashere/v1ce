import {
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
} from "@expo-google-fonts/inter";
import { BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";
import { BodoniModa_700Bold } from "@expo-google-fonts/bodoni-moda";
import { Cinzel_700Bold } from "@expo-google-fonts/cinzel";
import { CourierPrime_700Bold } from "@expo-google-fonts/courier-prime";
import { DMSans_700Bold } from "@expo-google-fonts/dm-sans";
import { Fredoka_400Regular } from "@expo-google-fonts/fredoka";
import { IBMPlexSerif_700Bold } from "@expo-google-fonts/ibm-plex-serif";
import { Pacifico_400Regular } from "@expo-google-fonts/pacifico";
import { Poppins_700Bold } from "@expo-google-fonts/poppins";
import { SpaceMono_700Bold } from "@expo-google-fonts/space-mono";
import { Syne_700Bold } from "@expo-google-fonts/syne";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

function RootNavigation() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="game" />
      <Stack.Screen name="widget" />
      <Stack.Screen name="coin-widget" />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
    BebasNeue_400Regular, BodoniModa_700Bold, Cinzel_700Bold, CourierPrime_700Bold,
    DMSans_700Bold, Fredoka_400Regular, IBMPlexSerif_700Bold, Pacifico_400Regular,
    Poppins_700Bold, SpaceMono_700Bold, Syne_700Bold,
  });

  useEffect(() => { if (loaded || error) SplashScreen.hideAsync(); }, [loaded, error]);
  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemeProvider>
              <AuthProvider>
                <RootNavigation />
              </AuthProvider>
            </ThemeProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
