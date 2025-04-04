import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider, useTheme } from "@/hooks/ThemeContext";
import { supabase } from "@/supabaseClient";
import AuthCheck from "@/components/AuthCheck"; // Asegúrate de la ruta correcta
import { AuthProvider } from "@/contexts/AuthContext";
import { Provider as PaperProvider } from "react-native-paper";
import "../i18n"; // Import i18n configuration
import Toast from "react-native-toast-message";
import toastConfig from "@/config/toastConfig";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded] = useFonts({
        SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    });
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    useEffect(() => {
        const checkAuth = async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
                router.replace("/login");
            }
        };

        checkAuth();

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("Auth State Change Event:", event, "Session:", session);
            if (session) {
                setIsAuthenticated(true);
                router.replace("/(tabs)");
            } else {
                setIsAuthenticated(false);
                router.replace("/login");
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    if (!loaded) {
        return null;
    }

    return (
        <AuthProvider>
            <ThemeProvider>
                <PaperProvider>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                        <AuthCheck />
                        <ThemeConsumer isAuthenticated={isAuthenticated} />
                        <Toast config={toastConfig} />
                    </GestureHandlerRootView>
                </PaperProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}

function ThemeConsumer({ isAuthenticated }: { isAuthenticated: boolean }) {
    const { theme } = useTheme(); // Obtenemos el tema del contexto

    return (
        <NavigationThemeProvider value={theme === "dark" ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
                {isAuthenticated ? (
                    <>
                        <Stack.Screen name="(tabs)" />
                        <Stack.Screen name="settings" />
                        <Stack.Screen name="search" />
                        <Stack.Screen name="+not-found" />
                    </>
                ) : (
                    <Stack.Screen name="login" options={{ headerShown: false }} />
                )}
            </Stack>
            <StatusBar style="auto" />
        </NavigationThemeProvider>
    );
}

