/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */
const tintColorLight = "#175676"; // Azul marino apagado, sobrio y elegante.
const tintColorDark = "#87B5BD"; // Azul neón suave, futurista y minimalista.

export const Colors = {
    light: {
        text: "#2D2D2D", // Gris carbón, legible sin ser agresivo.
        background: "#F4F4F4", // Gris perla, más suave que blanco puro.
        tint: tintColorLight, // Azul neominimalista.
        icon: "#6C6F7D", // Gris humo, discreto y moderno.
        tabIconDefault: "#9EA1A9", // Gris apagado para elementos secundarios.
        TabBarBackground: "#e4e8eb", // Gris perla, más suave que blanco puro.
        tabIconSelected: tintColorLight, // Azul acento cuando está activo.
        highlight: "#A94438", // Rojo terracota, elegante y no estridente.
    },
    dark: {
        text: "#EAEAEA", // Gris claro en lugar de blanco puro, menos fatiga visual.
        background: "#212020", // Negro carbón, sofisticado y envolvente.
        tint: tintColorDark, // Azul neón apagado, resalta sin ser chillón.
        icon: "#717782", // Gris humo oscuro, sutil y moderno.
        tabIconDefault: "#5E626A", // Gris acero, para neutralidad en elementos no seleccionados.
        tabIconSelected: tintColorDark, // Azul futurista para destacar lo importante.
        TabBarBackground: "#3e3f42", // Gris
        highlight: "#8D3A3A", // Rojo vino, elegante sin saturar la vista.
    },
};
