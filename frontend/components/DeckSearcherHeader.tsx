import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import { router } from "expo-router";

interface DeckSearcherHeaderProps {
    onSearchChange: (text: string) => void;
    isDeckSearch: boolean;
    toggleSearchMode: (isDeck: boolean) => void;
    t: any
}

const DeckSearcherHeader: React.FC<DeckSearcherHeaderProps> = ({ onSearchChange, isDeckSearch, toggleSearchMode, t }) => {
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearchChange = (text: string) => {
        setSearchQuery(text);
        onSearchChange(text);
    };

    return (
        <View style={[styles.headerContainer, { backgroundColor: Colors[theme].background }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={24} color={Colors[theme].text} />
            </TouchableOpacity>
            <TextInput
                style={[styles.searchBar, { color: Colors[theme].text }]}
                placeholder={`${t("search")}...`}
                placeholderTextColor={Colors[theme].tabIconDefault}
                value={searchQuery}
                onChangeText={handleSearchChange}
                autoCorrect={false}
            />
            <TouchableOpacity
                onPress={() => toggleSearchMode(true)}
                style={[
                    styles.toggleButton,
                    isDeckSearch && styles.activeButton,
                    { borderBottomColor: Colors[theme].tint },
                ]}
            >
                <Ionicons name="albums" size={24} color={isDeckSearch ? Colors[theme].tint : Colors[theme].text} />
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => toggleSearchMode(false)}
                style={[
                    styles.toggleButton,
                    !isDeckSearch && styles.activeButton,
                    { borderBottomColor: Colors[theme].tint },
                ]}
            >
                <Ionicons name="person" size={24} color={!isDeckSearch ? Colors[theme].tint : Colors[theme].text} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
        marginTop: 30,
    },
    searchBar: {
        paddingHorizontal: 8,
        fontSize: 18,
        flex: 1,
    },
    backButton: {
        paddingLeft: 10,
    },
    toggleButton: {
        marginLeft: 10,
        padding: 5,
    },
    activeButton: {
        borderBottomWidth: 2,
        borderBottomColor: "blue",
    },
});

export default DeckSearcherHeader;
