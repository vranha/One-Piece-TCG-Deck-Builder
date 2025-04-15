import React from "react";
import { View, Button, TouchableOpacity, StyleSheet, Image } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface HeaderProps {
    title: string;
}

export default function Header({ title }: HeaderProps) {
    const { theme } = useTheme();

    return (
        <View style={{ flexDirection: "row" }}>
            <ThemedText
                type="title"
                lightColor={Colors[theme].tint}
                darkColor={Colors[theme].tint}
                style={{ fontSize: 30, position: "relative", bottom: 5, left: 5 }}
            >
                {title.split(" ")[0][0].toLowerCase()}
            </ThemedText>
            <ThemedText
                type="title"
                lightColor={Colors[theme].tint}
                darkColor={Colors[theme].tint}
                style={{ fontSize: 28 }}
            >
                {title.split(" ")[0].slice(1).toUpperCase()}
            </ThemedText>
            <ThemedText type="title" style={{ fontSize: 28, position: "relative", right: 2 }}>
                {title.split(" ")[1].toLowerCase()}
            </ThemedText>
        </View>
    );
}

Header.LeftButton = function LeftButton() {
    return (
        <View style={{ marginLeft: 16 }}>
            <Image source={require("@/assets/images/icon-round.png")} style={styles.logo} />
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

Header.RightButtonSearch = function RightButtonSearch({ onPress }: any) {
    const { theme } = useTheme();
    return (
        <TouchableOpacity onPress={onPress} style={{ marginRight: 16 }}>
            <MaterialIcons name="style" size={28} color={Colors[theme].text} />
        </TouchableOpacity>
    );
};

Header.RightButtonDeckSearcher = function RightButtonDeckSearcher({ onPress }: any) {
    const { theme } = useTheme();
    return (
        <TouchableOpacity onPress={onPress} style={{ marginRight: 16 }}>
            <IconSymbol size={28} name="magnifyingglass" color={Colors[theme].text} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    logo: {
        width: 40,
        height: 40,
    },
});
