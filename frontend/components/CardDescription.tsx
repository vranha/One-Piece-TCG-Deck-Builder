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
        <View style={styles.descriptionContainer}>
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
                <View
                    style={{
                        alignItems: "flex-start",
                        backgroundColor: Colors[theme].backgroundSoft,
                        borderRadius: 5,
                        padding: 12,
                    }}
                >
                    <FormattedAbility text={cardDetail.ability} />
                </View>
            ) : (
                <ThemedText style={{ textAlign: "center", width: "100%" }} type="subtitle">
                    --No Effect--
                </ThemedText>
            )}
            {cardDetail.trigger ? (
                <View
                    style={{
                        alignItems: "flex-start",
                        backgroundColor: Colors[theme].icon,
                        borderRadius: 5,
                        padding: 12,
                    }}
                >
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
        paddingVertical: 10,
        paddingHorizontal: 15,
        gap: 10,
    },
    divider: {
        paddingHorizontal: 3,
        paddingVertical: 1,
        borderRadius: 5,
        marginVertical: 5,
    },
});

export default CardDescription;
