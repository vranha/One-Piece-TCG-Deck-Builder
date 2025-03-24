// app/(tabs)/chat.tsx
import React from "react";
import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";

export default function ChatScreen() {
    const { t } = useTranslation();

    return (
        <View>
            <Text>{t("welcome_chat")}</Text>
        </View>
    );
}
