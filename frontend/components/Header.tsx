import React from "react";
import { View, Button, TouchableOpacity, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";

interface HeaderProps {
    title: string;
}

export default function Header({ title }: HeaderProps)  {
    const { theme } = useTheme();

    return (
        <View style={{ flexDirection: "row" }}>
            <ThemedText
                type="title"
                lightColor={Colors[theme].tint}
                darkColor={Colors[theme].tint}
                style={{ fontSize: 28 }}
            >
                {title.split(" ")[0]}
            </ThemedText>
            <ThemedText type="title" style={{ fontSize: 28 }}>
                {title.split(" ")[1]}
            </ThemedText>
        </View>
    );
}

Header.LeftButton = function LeftButton() {
    return (
        <View style={{ marginLeft: 16 }}>
            <Button onPress={() => alert("Left button!")} title="Left" />
        </View>
    );
};

Header.RightButton = function RightButton({ onPress }: any) {
    const { theme } = useTheme();
    return (
        <TouchableOpacity onPress={onPress} style={{ marginRight: 16 }}>
            <IconSymbol size={28} name="gearshape.fill" color={Colors[theme].text} />
        </TouchableOpacity>
    );
};
