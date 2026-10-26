import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
  Inter_800ExtraBold_Italic,
  Inter_900Black_Italic,
} from "@expo-google-fonts/inter";
import { BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";
import { Cinzel_700Bold } from "@expo-google-fonts/cinzel";
import { CourierPrime_700Bold } from "@expo-google-fonts/courier-prime";
import { DMSans_700Bold } from "@expo-google-fonts/dm-sans";
import { Fredoka_400Regular } from "@expo-google-fonts/fredoka";
import { Pacifico_400Regular } from "@expo-google-fonts/pacifico";
import { Poppins_700Bold } from "@expo-google-fonts/poppins";
import { SpaceMono_700Bold } from "@expo-google-fonts/space-mono";
import { Syne_700Bold } from "@expo-google-fonts/syne";
import { RobotoMono_700Bold } from "@expo-google-fonts/roboto-mono";
import { Oswald_600SemiBold } from "@expo-google-fonts/oswald";
import { Raleway_700Bold } from "@expo-google-fonts/raleway";
import { Caveat_400Regular } from "@expo-google-fonts/caveat";
import { DynaPuff_600SemiBold } from "@expo-google-fonts/dynapuff";
import { VT323_400Regular } from "@expo-google-fonts/vt323";
import { IMFellEnglishSC_400Regular } from "@expo-google-fonts/im-fell-english-sc";
import { Slackey_400Regular } from "@expo-google-fonts/slackey";
import { JosefinSans_700Bold } from "@expo-google-fonts/josefin-sans";
import { VarelaRound_400Regular } from "@expo-google-fonts/varela-round";
import { WalterTurncoat_400Regular } from "@expo-google-fonts/walter-turncoat";
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { CoinProvider } from "@/context/CoinContext";
import { PremiumProvider } from "@/context/PremiumContext";
import { LanguageProvider } from "@/lib/i18n";
import AppChrome from "@/components/layout/AppChrome";

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: true,
          header: () => <AppChrome showNav />,
        }}
      />
      <Stack.Screen name="widget" />
      <Stack.Screen name="coin-widget" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
    Inter_800ExtraBold_Italic,
    Inter_900Black_Italic,
    BebasNeue_400Regular,
    Cinzel_700Bold,
    CourierPrime_700Bold,
    DMSans_700Bold,
    Fredoka_400Regular,
    Pacifico_400Regular,
    Poppins_700Bold,
    SpaceMono_700Bold,
    Syne_700Bold,
    RobotoMono_700Bold,
    Oswald_600SemiBold,
    Raleway_700Bold,
    Caveat_400Regular,
    DynaPuff_600SemiBold,
    VT323_400Regular,
    IMFellEnglishSC_400Regular,
    Slackey_400Regular,
    JosefinSans_700Bold,
    VarelaRound_400Regular,
    WalterTurncoat_400Regular,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    BigShouldersStencilDisplayRegular: require("../assets/fonts/BigShouldersStencilDisplay-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <LanguageProvider>
                <ThemeProvider>
                  <AuthProvider>
                    <CoinProvider>
                      <PremiumProvider>
                        <RootLayoutNav />
                      </PremiumProvider>
                    </CoinProvider>
                  </AuthProvider>
                </ThemeProvider>
              </LanguageProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
