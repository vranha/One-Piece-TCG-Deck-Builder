/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */
const tintColorLight = "#D32F2F"; // Rojo vibrante
const tintColorDark = "#a84848"; // Rojo más suave para modo oscuro
const secondaryColor = "#edc398"; // Beige cálido

export const Colors = {
    light: {
        text: "#2D2D2D",
        textSoft: "#393939",
        background: "#FFFFFF",
        backgroundSoft: "#e3e3e3",
        tint: tintColorLight,
        icon: tintColorLight,
        tabIconDefault: "#BDBDBD",
        tabIconSelected: tintColorLight,
        TabBarBackground: "#F5F5F5",
        close: "#B71C1C", // Rojo más oscuro para botones de cierre
        highlight: secondaryColor,
        disabled: "#BDBDBD",
        disabledButton: "#E0E0E0", // Light gray for disabled buttons
        triggerActive: "#F8E92B",
        triggerInactive: "#757575",
        triggerActiveText: "#2D2D2D",
        triggerInactiveText: "#5A5A5A",
        success: "#4CAF50", // Verde para éxito
        error: "#F44336", // Rojo para error
        info: "#2196F3", // Azul para información
        modalHandle: "#CCCCCC", // Light gray for modal handle
ownMessageBackground: "#E9F3FFA6", // azul pastel con opacidad
ownMessageText: "#1F1F1F",         // texto oscuro
        receivedMessageBackground: "#EDEDED", // Gris medio claro (separa bien de `#F5F5F5`)
        receivedMessageText: "#2D2D2D",
        deckBar: "#FFD600", // Amarillo OP para barra lateral de mensajes de deck
        cardBar: "#FF7043", // Naranja para barra lateral de mensajes de card
    },
    dark: {
        text: "#EAEAEA",
        textSoft: "#D2D2D2",
        background: "#121212",
        backgroundSoft: "#2e2e2e",
        tint: tintColorDark,
        icon: tintColorDark,
        tabIconDefault: "#757575",
        tabIconSelected: tintColorDark,
        TabBarBackground: "#1E1E1E",
        close: "#FF1744", // Rojo más vivo en modo oscuro
        highlight: secondaryColor,
        disabled: "#616161",
        disabledButton: "#424242", // Dark gray for disabled buttons
        triggerActive: "#F8E92B",
        triggerInactive: "#424242",
        triggerActiveText: "#2D2D2D",
        triggerInactiveText: "#9E9E9E",
        success: "#81C784", // Verde más suave para éxito
        error: "#E57373", // Rojo más suave para error
        info: "#64B5F6", // Azul más suave para información
        modalHandle: "#555555", // Dark gray for modal handle
ownMessageBackground: "#2F3F5C66", // azul marino desaturado con opacidad
ownMessageText: "#F0F4FA",         // texto gris claro azuladito
        receivedMessageBackground: "#2B2B2B", // Ligeramente más claro que el fondo `#1E1E1E`
        receivedMessageText: "#D2D2D2",
        deckBar: "#FFD600", // Amarillo OP para barra lateral de mensajes de deck
        cardBar: "#FF7043", // Naranja para barra lateral de mensajes de card
    },
};
