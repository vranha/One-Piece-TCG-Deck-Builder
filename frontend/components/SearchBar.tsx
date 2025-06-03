import React from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import { useTranslation } from "react-i18next";
import { router, useLocalSearchParams } from "expo-router";
import useStore from "@/store/useStore";

interface SearchBarProps {
    onSearchChange: (text: string) => void;
    onClearFilters: () => void;
    onOpenFilterModal: () => void;
    onToggleCardSize: () => void;
    isBaseRoute: boolean;
    cardSizeOption: number;
    isSelectionEnabled: boolean;
    toggleSelectionMode: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
    onSearchChange,
    onClearFilters,
    onOpenFilterModal,
    onToggleCardSize,
    isBaseRoute,
    cardSizeOption,
    isSelectionEnabled,
    toggleSelectionMode,
}) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const { searchQuery } = useStore();

    const params = useLocalSearchParams();
    const isAttachCardMode = params.mode === "attachCard";

    return (
        <View style={styles.headerContainer}>
            {isAttachCardMode ?
            <TouchableOpacity onPress={() => router.push({
            pathname: "/(tabs)",
            params: {
                openModalize: "1",
                chatId: params.chatId,
            },
        })} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={24} color={Colors[theme].text} />
            </TouchableOpacity>
            :
            <TouchableOpacity onPress={() => router.push("/")} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={24} color={Colors[theme].text} />
            </TouchableOpacity>
            }
            <TextInput
                style={[styles.searchBar, { color: Colors[theme].text }]}
                placeholder={t("search_cards")}
                placeholderTextColor={Colors[theme].tabIconDefault}
                value={searchQuery}
                onChangeText={onSearchChange}
                autoCorrect={false}
            />
            {!isBaseRoute && (
                <TouchableOpacity onPress={onClearFilters} style={styles.closeButton}>
                    <MaterialIcons name="close" size={24} color={Colors[theme].tint} />
                </TouchableOpacity>
            )}
            <TouchableOpacity onPress={toggleSelectionMode}>
                <MaterialIcons
                    name={isSelectionEnabled ? "check-circle" : "check-circle-outline"}
                    size={24}
                    color={ isSelectionEnabled ? Colors[theme].info :Colors[theme].text}
                />
            </TouchableOpacity>
            <TouchableOpacity onPress={onOpenFilterModal} style={styles.filterButton}>
                <MaterialIcons name="filter-list" size={24} color={ isBaseRoute ? Colors[theme].text :Colors[theme].info} />
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
    closeButton: {
        marginHorizontal: 5,
    },
});

export default SearchBar;
