/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */
const tintColorLight = "#175676"; // Azul marino apagado, sobrio y elegante.
const tintColorDark = "#87B5BD"; // Azul neón suave, futurista y minimalista.

export const Colors = {
    light: {
        text: "#2D2D2D",
        background: "#F4F4F4",
        tint: tintColorLight,
        icon: "#6C6F7D",
        tabIconDefault: "#9EA1A9",
        TabBarBackground: "#e4e8eb",
        tabIconSelected: tintColorLight,
        close: "#A94438",
        highlight: "#816bff",
        disabled: "#d2d4d8",
        triggerActive: "#FFD700", // Amarillo brillante para estado activo
        triggerInactive: "#C0B283", // Amarillo apagado para estado inactivo
        triggerActiveText: "#000000", // Texto negro cuando está activo
        triggerInactiveText: "#6C6F7D", // Texto gris apagado cuando está inactivo
    },
    dark: {
        text: "#EAEAEA",
        background: "#212020",
        tint: tintColorDark,
        icon: "#717782",
        tabIconDefault: "#5E626A",
        tabIconSelected: tintColorDark,
        TabBarBackground: "#3e3f42",
        close: "#8D3A3A",
        highlight: "#816bff",
        disabled: "#555353",
        triggerActive: "#FFC107", // Amarillo dorado para estado activo
        triggerInactive: "#7A6F4F", // Amarillo oscuro apagado para estado inactivo
        triggerActiveText: "#000000", // Texto negro cuando está activo
        triggerInactiveText: "#A9A9A9", // Texto gris oscuro cuando está inactivo
    },
};

