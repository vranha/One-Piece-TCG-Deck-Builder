import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import FormattedAbility from "@/hooks/useFormattedAbility";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";

interface CardDescriptionProps {
    cardDetail: {
        ability: string;
        trigger: string;
    };
    dividerStyle: { type: string; color: string; colors?: string[] };
}

const CardDescription: React.FC<CardDescriptionProps> = ({ cardDetail, dividerStyle }) => {
    const { theme } = useTheme();

    return (
        <View
            style={[
                styles.descriptionContainer,
                {
                    backgroundColor: Colors[theme].background,
                    borderRadius: 14,
                },
            ]}
        >
            {dividerStyle.type === "gradient" ? (
                <LinearGradient
                    colors={dividerStyle.colors as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.divider}
                />
            ) : (
                <View style={[styles.divider, { backgroundColor: dividerStyle.color }]} />
            )}
            {cardDetail.ability !== "-" ? (
                <View style={[styles.abilityBlock, { backgroundColor: Colors[theme].background }]}>
                    <FormattedAbility text={cardDetail.ability} />
                </View>
            ) : (
                <ThemedText
                    style={{
                        textAlign: "center",
                        width: "100%",
                        color: Colors[theme].textSoft,
                        fontStyle: "italic",
                        fontSize: 15,
                    }}
                    type="subtitle"
                >
                    --No Effect--
                </ThemedText>
            )}
            {cardDetail.trigger ? (
                <View style={[styles.abilityBlock, { backgroundColor: Colors[theme].icon }]}>
                    <FormattedAbility trigger text={cardDetail.trigger} />
                </View>
            ) : null}
            {dividerStyle.type === "gradient" ? (
                <LinearGradient
                    colors={dividerStyle.colors as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.divider}
                />
            ) : (
                <View style={[styles.divider, { backgroundColor: dividerStyle.color }]} />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    descriptionContainer: {
        marginTop: 0,
        paddingVertical: 16,
        paddingHorizontal: 18,
        gap: 14,
    },
    divider: {
        height: 4,
        borderRadius: 5,
        marginVertical: 10,
    },
    abilityBlock: {
        alignItems: "flex-start",
        borderRadius: 8,
        padding: 14,
        marginBottom: 2,
    },
});

export default CardDescription;
