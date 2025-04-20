import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import DropDownPicker from "react-native-dropdown-picker";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import { useTranslation } from "react-i18next";
import useStore from "@/store/useStore";

interface DropdownsContainerProps {
    formattedSetNames: { original: string; formatted: string }[];
    families: string[];
}

const DropdownsContainer: React.FC<DropdownsContainerProps> = ({ formattedSetNames, families }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const { selectedSet, setSelectedSet, selectedFamily, setSelectedFamily } = useStore();
    const [openSet, setOpenSet] = React.useState(false);
    const [openFamily, setOpenFamily] = React.useState(false);

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
                            key: original, 
                        })),
                    ]}
                    itemKey="value"
                    value={selectedSet}
                    setValue={(callback) => {
                        const newValue = typeof callback === "function" ? callback(selectedSet) : callback;
                        if (newValue !== selectedSet) {
                            setSelectedSet(newValue);
                        }
                    }}
                    onChangeValue={(value) => setSelectedSet(value)}
                    style={[
                        styles.picker,
                        { backgroundColor: Colors[theme].background, borderColor: Colors[theme].info },
                    ]}
                    labelStyle={{ color: Colors[theme].text }}
                    selectedItemLabelStyle={{ fontWeight: "bold" }}
                    placeholder={t("select_set")}
                    placeholderStyle={{ color: Colors[theme].tabIconDefault }}
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
                            key: family, // Usamos `family` como clave única
                        })),
                    ]}
                    itemKey="value"
                    value={selectedFamily}
                    setValue={(callback) => {
                        const newValue = typeof callback === "function" ? callback(selectedFamily) : callback;
                        if (newValue !== selectedFamily) {
                            setSelectedFamily(newValue);
                        }
                    }}
                    onChangeValue={(value) => setSelectedFamily(value)}
                    style={[
                        styles.picker,
                        { backgroundColor: Colors[theme].background, borderColor: Colors[theme].info },
                    ]}
                    labelStyle={{ color: Colors[theme].text }}
                    selectedItemLabelStyle={{ fontWeight: "bold" }}
                    placeholder={t("select_family")}
                    placeholderStyle={{ color: Colors[theme].tabIconDefault }}
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
        width: "100%",
    },
});

export default DropdownsContainer;
