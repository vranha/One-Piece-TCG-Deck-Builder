import { useState, useEffect } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Clave para almacenar el tema en AsyncStorage
const THEME_KEY = "theme_preference";

export function useColorScheme() {
    const [theme, setTheme] = useState<string | null>(null);

    useEffect(() => {
        // Obtener el tema guardado en AsyncStorage
        AsyncStorage.getItem(THEME_KEY).then((storedTheme) => {
            if (storedTheme) {
                setTheme(storedTheme);
            } else {
                // Si no hay tema guardado, usar el del sistema
                setTheme(Appearance.getColorScheme() ?? "light");
            }
        });
    }, []);

    return theme;
}

// Función para cambiar el tema y guardarlo en AsyncStorage
export async function toggleTheme(currentTheme: string) {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    await AsyncStorage.setItem(THEME_KEY, newTheme);
}
