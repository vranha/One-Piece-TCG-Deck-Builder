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
    t: any;
    onOpenFilterModal: () => void; // Add this prop
    filtersActive: string | boolean; // Add this prop to indicate if any filter is active
    onResetFilters: () => void; // Add this prop to reset filters
}

const DeckSearcherHeader: React.FC<DeckSearcherHeaderProps> = ({
    onSearchChange,
    isDeckSearch,
    toggleSearchMode,
    t,
    onOpenFilterModal,
    filtersActive,
    onResetFilters, // Add this prop to reset filters
}) => {
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
            <View style={styles.rightContainer}>
                {filtersActive && ( // Show the reset button only if filters are active
                    <TouchableOpacity onPress={onResetFilters} style={{marginRight: -5}}>
                        <Ionicons name="close" size={24} color={Colors[theme].error} />
                    </TouchableOpacity>
                )}
                <TouchableOpacity onPress={onOpenFilterModal} style={{marginRight: -10}}>
                    <MaterialIcons
                        name="filter-list"
                        size={24}
                        color={filtersActive ? Colors[theme].info : Colors[theme].text}
                    />
                </TouchableOpacity>
                <View style={styles.verticalSeparator} />
                <TouchableOpacity
                    onPress={() => toggleSearchMode(true)}
                    style={[
                        styles.toggleButton,
                        isDeckSearch && styles.activeButton,
                        { borderBottomColor: Colors[theme].info },
                    ]}
                >
                    <Ionicons name="albums" size={24} color={isDeckSearch ? Colors[theme].info : Colors[theme].text} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => toggleSearchMode(false)}
                    style={[
                        styles.toggleButton,
                        !isDeckSearch && styles.activeButton,
                        { borderBottomColor: Colors[theme].info },
                    ]}
                >
                    <Ionicons name="person" size={24} color={!isDeckSearch ? Colors[theme].info : Colors[theme].text} />
                </TouchableOpacity>
            </View>
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
        paddingHorizontal: 10, // Add padding to prevent overflow
    },
    searchBar: {
        flex: 1,
        maxWidth: "60%", // Limit the width of the search bar
        paddingHorizontal: 8,
        fontSize: 18,
    },
    backButton: {
        paddingLeft: 12,
    },
    rightContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        flexShrink: 1, // Allow the container to shrink if needed
        gap: 10, // Add spacing between buttons
    },
    toggleButton: {
        padding: 5,
    },
    activeButton: {
        borderBottomWidth: 2,
        borderBottomColor: "blue",
    },

    verticalSeparator: {
        width: 1,
        height: 24,
        backgroundColor: Colors.light.tabIconDefault,
        marginHorizontal: 10,
    },
});

export default DeckSearcherHeader;
