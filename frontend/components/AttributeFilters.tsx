import React, { useState, useRef } from "react";
import { View, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { ThemedText } from "@/components/ThemedText";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useTranslation } from "react-i18next";

interface AttributeFiltersProps {
    attributes: { attribute_name: string; attribute_image: string }[];
    selectedAttributes: string[];
    onAttributeSelect: (attribute: string | null) => void;
    theme: "light" | "dark";
}

const AttributeFilters: React.FC<AttributeFiltersProps> = ({
    attributes,
    selectedAttributes,
    onAttributeSelect,
    theme,
}) => {
    const [isAccordionOpen, setIsAccordionOpen] = useState(false);
    const accordionHeight = useRef(new Animated.Value(0)).current; // Use useRef to persist the value
    const { t } = useTranslation();

    const toggleAccordion = () => {
        const newValue = !isAccordionOpen;
        setIsAccordionOpen(newValue);

        Animated.timing(accordionHeight, {
            toValue: newValue ? 250 : 0, // Adjust height as needed
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    return (
        <>
            <TouchableOpacity
                onPress={toggleAccordion}
                style={[styles.accordionHeader, { backgroundColor: Colors[theme].background }]}
            >
                <View style={styles.headerContent}>
                    <ThemedText style={[styles.accordionHeaderText, { color: Colors[theme].text }]}>
                        {t("attributes")}
                    </ThemedText>
                    <MaterialIcons
                        name={isAccordionOpen ? "expand-less" : "expand-more"}
                        size={24}
                        color={Colors[theme].text}
                    />
                </View>
                {selectedAttributes.length > 0 && (
                    <TouchableOpacity
                        onPress={() => onAttributeSelect(null)} // Clear all selected attributes
                        style={[styles.clearButton, { backgroundColor: Colors[theme].TabBarBackground }]}
                    >
                        <ThemedText style={[styles.attributeCount, { color: Colors[theme].tint }]}>
                            {selectedAttributes.length}
                        </ThemedText>
                        <MaterialIcons name="close" size={16} color={Colors[theme].text} />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>

            <Animated.View style={{ height: accordionHeight, overflow: "hidden", marginTop: 10 }}>
                <View style={styles.container}>
                    {attributes.map((attribute) => (
                        <TouchableOpacity
                            key={attribute.attribute_name}
                            style={[
                                styles.attributeButton,
                                {  backgroundColor: Colors[theme].TabBarBackground, borderColor: Colors[theme].background, opacity: 0.9 },
                                selectedAttributes.includes(attribute.attribute_name) && {
                                    backgroundColor: Colors[theme].tint,
                                },
                            ]}
                            onPress={() => onAttributeSelect(attribute.attribute_name)}
                        >
                            <ExpoImage
                                contentFit="contain"
                                cachePolicy="memory-disk"
                                source={{ uri: attribute.attribute_image }}
                                style={styles.attributeImage}
                            />
                            <ThemedText style={[styles.attributeText, { color: Colors[theme].text }]}>
                                {attribute.attribute_name}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </View>
            </Animated.View>
        </>
    );
};

const styles = StyleSheet.create({
    accordionHeader: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        marginTop: 10,
        marginBottom: 10,
    },
    accordionHeaderText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    attributeCount: {
        fontSize: 12,
        fontWeight: "bold",
        position: "absolute",
        top: -10,
        right: -10,
    },
    clearButton: {
        marginLeft: 10,
        padding: 5,
        borderRadius: 10,
        fontWeight: "bold",
    },
    container: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        paddingHorizontal: 10,
    },
    attributeButton: {
        width: "30%", // Ensures 3 columns
        marginVertical: 5,
        paddingTop: 7,
        paddingBottom: 4,
        paddingHorizontal: 12,
        borderRadius: 5,
        alignItems: "center",
        justifyContent: "center",
        // borderWidth: 2,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    attributeImage: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginBottom: 5,
    },
    attributeText: {
        fontSize: 12,
        fontWeight: "bold",
        textAlign: "center",
    },
});

export default AttributeFilters;
