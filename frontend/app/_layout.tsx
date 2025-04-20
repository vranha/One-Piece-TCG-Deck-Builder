import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider, useTheme } from "@/hooks/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Provider as PaperProvider } from "react-native-paper";
import "../i18n"; // Configuración de i18n
import Toast from "react-native-toast-message";
import toastConfig from "@/config/toastConfig";

// Evitamos que el splash se oculte automáticamente
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // Cuando las fuentes están cargadas, ocultamos el splash
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AuthProvider>
      <ThemeProvider>
        <PaperProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <NavigationContainerWithTheme />
            <Toast config={toastConfig} />
          </GestureHandlerRootView>
        </PaperProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

function NavigationContainerWithTheme() {
  const { theme } = useTheme();

  return (
    <NavigationThemeProvider value={theme === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} backgroundColor="transparent" translucent />
      <Stack screenOptions={{ headerShown: false }} />
    </NavigationThemeProvider>
  );
}
