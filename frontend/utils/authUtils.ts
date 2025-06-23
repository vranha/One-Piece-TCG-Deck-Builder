import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Alert } from "react-native";

// Configurar WebBrowser para completar sesiones de autenticación correctamente
WebBrowser.maybeCompleteAuthSession();

export const getRedirectUri = () => {
    // Usar siempre el mismo scheme para consistencia
    const redirectUri = AuthSession.makeRedirectUri({
        scheme: "oplab",
        path: "auth/callback",
    });

    console.log("🎯 Generated redirectUri:", redirectUri);
    console.log("🏷️ Environment:", __DEV__ ? "Development" : "Production");

    return redirectUri;
};

export const debugRedirectUri = (redirectUri: string) => {
    console.log("OAuth Redirect URI:", redirectUri);
    console.log("Environment:", __DEV__ ? "Development" : "Production");
    console.log("Platform:", process.env.EXPO_OS);

    // Verificar si es una URL válida
    try {
        new URL(redirectUri);
        console.log("✅ Redirect URI is valid URL");
    } catch (error) {
        console.log("❌ Redirect URI is not a valid URL");
    }
};

export const extractTokensFromUrl = (url: string): { access_token?: string; refresh_token?: string } => {
    try {
        const urlObj = new URL(url);

        // Intentar obtener tokens de query parameters
        let access_token = urlObj.searchParams.get("access_token");
        let refresh_token = urlObj.searchParams.get("refresh_token");

        // Si no están en query params, buscar en el hash
        if (!access_token && urlObj.hash) {
            const hashParams = new URLSearchParams(urlObj.hash.substring(1));
            access_token = hashParams.get("access_token");
            refresh_token = hashParams.get("refresh_token");
        }

        return {
            access_token: access_token || undefined,
            refresh_token: refresh_token || undefined,
        };
    } catch (error) {
        console.error("Error extracting tokens from URL:", error);
        return {};
    }
};
