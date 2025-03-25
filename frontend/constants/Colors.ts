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
        background: "#FFFFFF",
        tint: tintColorLight,
        icon: tintColorLight,
        tabIconDefault: "#BDBDBD",
        tabIconSelected: tintColorLight,
        TabBarBackground: "#F5F5F5",
        close: "#B71C1C", // Rojo más oscuro para botones de cierre
        highlight: secondaryColor,
        disabled: "#BDBDBD",
        triggerActive: "#F8E92B",
        triggerInactive: "#757575",
        triggerActiveText: "#2D2D2D",
        triggerInactiveText: "#5A5A5A",
    },
    dark: {
        text: "#EAEAEA",
        background: "#121212",
        tint: tintColorDark,
        icon: tintColorDark,
        tabIconDefault: "#757575",
        tabIconSelected: tintColorDark,
        TabBarBackground: "#1E1E1E",
        close: "#FF1744", // Rojo más vivo en modo oscuro
        highlight: secondaryColor,
        disabled: "#616161",
        triggerActive: "#F8E92B",
        triggerInactive: "#424242",
        triggerActiveText: "#2D2D2D",
        triggerInactiveText: "#9E9E9E",
    },
};