import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Modalize } from "react-native-modalize";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";

const VISIBILITY_OPTIONS = [
    { value: "public", labelKey: "public" },
    { value: "friends", labelKey: "friends" },
    { value: "private", labelKey: "private" },
];

type VisibilityState = {
    decks: string;
    friends: string;
    collections: string;
};

type VisibilityBottomSheetProps = {
    visible: boolean;
    onClose: () => void;
    currentVisibility: VisibilityState;
    onChange: (changes: Partial<VisibilityState>) => void;
};

export default function VisibilityBottomSheet({
    visible,
    onClose,
    currentVisibility,
    onChange,
}: VisibilityBottomSheetProps) {
    const { t } = useTranslation();
    const modalizeRef = useRef<Modalize>(null);
    const { theme } = useTheme();

    useEffect(() => {
        if (visible) {
            console.log("Opening visibility modal", currentVisibility);
            modalizeRef.current?.open();
        } else {
            modalizeRef.current?.close();
        }
    }, [visible]);

    const renderSection = (type: keyof VisibilityState, label: string) => (
        <View style={{ marginBottom: 20 }}>
            <Text style={[styles.sectionTitle, { color: Colors[theme]. text}]}>{label}</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
                {VISIBILITY_OPTIONS.map((opt) => (
                    <TouchableOpacity
                        key={opt.value}
                        style={[styles.option, currentVisibility[type] === opt.value ? {backgroundColor: Colors[theme].tint} : {backgroundColor: Colors[theme].TabBarBackground }]}
                        onPress={() => onChange({ [type]: opt.value })}
                    >
                        <Text style={[styles.optionText, currentVisibility[type] === opt.value ? {color: Colors[theme].text} : {color: Colors[theme].tabIconDefault }]}>{t(opt.labelKey)}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    return (
        <Modalize
            ref={modalizeRef}
            adjustToContentHeight
            onClosed={onClose}
            modalStyle={[styles.modal, { backgroundColor: Colors[theme].background }]}
        >
            <View style={styles.container}>
                <Text style={[styles.title, { color: Colors[theme].text}]}>{t("edit_visibility")}</Text>
                {renderSection("decks", t("decks"))}
                {renderSection("friends", t("friends"))}
                {renderSection("collections", t("collections"))}
            </View>
        </Modalize>
    );
}

const styles = StyleSheet.create({
    modal: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingBottom: 80,
    },
    container: { padding: 20,paddingBottom: 100, alignItems: "center", justifyContent: "center" },
    title: { fontWeight: "bold", fontSize: 18, marginBottom: 16, textAlign: "center" },
    sectionTitle: { fontWeight: "600", fontSize: 16, marginBottom: 8 },
    option: {
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 8,
        marginRight: 8,
        fontWeight: "bold",
    },

    optionText: {
        fontSize: 16,
        color: "#222",
        fontWeight: "bold",
    },
});
