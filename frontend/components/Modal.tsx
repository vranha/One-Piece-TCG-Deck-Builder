import React from "react";
import { View, StyleSheet } from "react-native";
import { Modalize } from "react-native-modalize";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/ThemeContext";
import { Colors } from "@/constants/Colors";

const Modal = React.forwardRef((props, ref) => {
    const { theme } = useTheme();

    return (
        <Modalize ref={ref} snapPoint={500} modalStyle={{ backgroundColor: Colors[theme].TabBarBackground }}>
            <View style={styles.container}>
                <ThemedText type="subtitle" style={[styles.text, { color: Colors[theme].text }]}>
                    ¿En que puedo ayudarte?..
                </ThemedText>
            </View>
        </Modalize>
    );
});

const styles = StyleSheet.create({
    container: {
        padding: 20,
        marginTop: 40,
    },
    text: {
        fontSize: 18,
    },
});

export default Modal;
