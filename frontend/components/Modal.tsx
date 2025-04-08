import React from "react";
import { View, StyleSheet } from "react-native";
import { Modalize } from "react-native-modalize";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/ThemeContext";
import { Colors } from "@/constants/Colors";
import { useTranslation } from "react-i18next";

const Modal = React.forwardRef((props, ref) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    return (
        <Modalize ref={ref} modalStyle={{ backgroundColor: Colors[theme].TabBarBackground }} adjustToContentHeight
        childrenStyle={{ height: 500 }}>
            <View style={styles.container}>
                <ThemedText type="subtitle" style={[styles.text, { color: Colors[theme].text }]}>
                    {t("welcome_chat")}
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
