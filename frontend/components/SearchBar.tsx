import React from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";

interface SearchBarProps {
    searchQuery: string;
    onSearchChange: (text: string) => void;
    onClearFilters: () => void;
    onOpenFilterModal: () => void;
    onToggleCardSize: () => void;
    isBaseRoute: boolean;
    cardSizeOption: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
    searchQuery,
    onSearchChange,
    onClearFilters,
    onOpenFilterModal,
    onToggleCardSize,
    isBaseRoute,
    cardSizeOption,
}) => {
    const { theme } = useTheme();
    const { t } = useTranslation();

    return (
        <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => router.push("/")} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={24} color={Colors[theme].text} />
            </TouchableOpacity>
            <TextInput
                style={[styles.searchBar, { color: Colors[theme].text }]}
                placeholder={t("search_cards")}
                placeholderTextColor={Colors[theme].tabIconDefault}
                value={searchQuery}
                onChangeText={onSearchChange}
                autoCorrect={false}
            />
            {!isBaseRoute && (
                <TouchableOpacity onPress={onClearFilters}>
                    <MaterialIcons name="close" size={24} color={Colors[theme].close} />
                </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onOpenFilterModal} style={styles.filterButton}>
                <MaterialIcons name="filter-list" size={24} color={Colors[theme].highlight} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onToggleCardSize} style={styles.cardSizeToggle}>
                <MaterialIcons
                    name={cardSizeOption === 0 ? "view-module" : cardSizeOption === 1 ? "view-agenda" : "view-list"}
                    size={24}
                    color={Colors[theme].text}
                />
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
    cardSizeToggle: {
        marginLeft: 10,
    },
    filterButton: {
        marginLeft: 10,
    },
});

export default SearchBar;
