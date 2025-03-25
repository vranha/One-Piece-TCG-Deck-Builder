import React, { Dispatch, SetStateAction } from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import DropDownPicker from "react-native-dropdown-picker";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import { useTranslation } from "react-i18next";

interface DropdownsContainerProps {
    formattedSetNames: { original: string; formatted: string }[];
    families: string[];
    selectedSet: string | null;
    setSelectedSet: Dispatch<SetStateAction<string | null>>;
    openSet: boolean;
    setOpenSet: Dispatch<SetStateAction<boolean>>;
    selectedFamily: string | null;
    setSelectedFamily: Dispatch<SetStateAction<string | null>>;
    openFamily: boolean;
    setOpenFamily: Dispatch<SetStateAction<boolean>>;
}

const DropdownsContainer: React.FC<DropdownsContainerProps> = ({
    formattedSetNames,
    families,
    selectedSet,
    setSelectedSet,
    openSet,
    setOpenSet,
    selectedFamily,
    setSelectedFamily,
    openFamily,
    setOpenFamily,
}) => {
    const { theme } = useTheme();
    const { t } = useTranslation();

    return (
        <View style={styles.dropdownsContainer}>
            <View style={styles.pickerContainer}>
                <ThemedText style={[styles.pickerLabel, { color: Colors[theme].text }]}>Set</ThemedText>
                <DropDownPicker
                    items={[
                        { label: t("all_sets"), value: undefined },
                        ...formattedSetNames.map(({ original, formatted }) => ({
                            label: formatted,
                            value: original,
                        })),
                    ]}
                    itemKey="value"
                    value={selectedSet}
                    setValue={setSelectedSet}
                    onChangeValue={(value) => setSelectedSet(value)}
                    style={[styles.picker, { backgroundColor: Colors[theme].background, borderColor: Colors[theme].highlight }]}
                    labelStyle={{ color: Colors[theme].text }}
                    selectedItemLabelStyle={{ fontWeight: "bold" }}
                    placeholder={t("select_set")}
                    placeholderStyle={{ color: Colors[theme].text }}
                    searchable={true}
                    searchPlaceholder={t("search_set")}
                    multiple={false}
                    open={openSet}
                    setOpen={setOpenSet}
                    modalProps={{
                        animationType: "slide",
                    }}
                    modalContentContainerStyle={{
                        padding: 10,
                        shadowColor: Colors[theme].background,
                    }}
                />
            </View>
            <View style={styles.pickerContainer}>
                <ThemedText style={[styles.pickerLabel, { color: Colors[theme].text }]}>{t("family")}</ThemedText>
                <DropDownPicker
                    items={[
                        { label: t("all_families"), value: undefined },
                        ...families.sort().map((family) => ({
                            label: family,
                            value: family,
                        })),
                    ]}
                    itemKey="value"
                    value={selectedFamily}
                    setValue={setSelectedFamily}
                    onChangeValue={(value) => setSelectedFamily(value)}
                    style={[styles.picker, { backgroundColor: Colors[theme].background, borderColor: Colors[theme].highlight }]}
                    labelStyle={{ color: Colors[theme].text }}
                    selectedItemLabelStyle={{ fontWeight: "bold" }}
                    placeholder={t("select_family")}
                    placeholderStyle={{ color: Colors[theme].text }}
                    searchable={true}
                    searchPlaceholder={t("search_family")}
                    multiple={false}
                    open={openFamily}
                    setOpen={setOpenFamily}
                    modalProps={{
                        animationType: "slide",
                    }}
                    modalContentContainerStyle={{
                        padding: 10,
                        shadowColor: Colors[theme].background,
                    }}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    dropdownsContainer: {
        flexDirection: "row",
        marginBottom: 10,
        gap: 10,
    },
    pickerContainer: {
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        marginHorizontal: 5,
        gap: 5,
    },
    pickerLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
    },
    picker: {
        flex: 1,
        height: 50,
        borderWidth: 2,
        borderRadius: 8,
        fontSize: 16,
        paddingHorizontal: 10,
        // color: Colors.light.icon,
        width: "100%",
    },
});

export default DropdownsContainer;
