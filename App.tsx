import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import Toast from "react-native-toast-message";
// ...existing imports...

export default function App() {
    return (
        <NavigationContainer>
            {/* ...existing components... */}
            <Toast /> {/* Asegúrate de incluir este componente */}
        </NavigationContainer>
    );
}
