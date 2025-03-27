import React from "react";
import { View, Image, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";

interface CardStatsProps {
    cardDetail: {
        attribute_image: string;
        attribute_name: string;
        type: string;
        cost: number;
        power: number;
        counter: string;
        code: string;
        rarity: string;
        images_large: string;
    };
    hasPower: boolean;
    dividerStyle: { color: string };
}

const CardStats: React.FC<CardStatsProps> = ({ cardDetail, hasPower, dividerStyle }) => {
    const { theme } = useTheme();

    return (
        <View style={styles.cardContainer}>
            {/* Columna Izquierda (Stats) */}
            <View style={[styles.statsContainer, { backgroundColor: Colors[theme].TabBarBackground }]}>
                <View style={{ alignItems: "center" }}>
                    <Image source={{ uri: cardDetail.attribute_image }} style={styles.attributeImage} />
                    <ThemedText style={styles.attributeText}>{cardDetail.attribute_name}</ThemedText>
                    <ThemedText type="subtitle" style={styles.statType}>
                        {cardDetail.type}
                    </ThemedText>
                </View>
                <View style={{ alignItems: "center" }}>
                    <ThemedText style={[styles.statTitle, { color: Colors[theme].icon }]}>Cost</ThemedText>
                    <ThemedText style={styles.statText}>{cardDetail.cost}</ThemedText>
                </View>
                {hasPower && (
                    <View style={{ alignItems: "center" }}>
                        <ThemedText style={[styles.statTitle, { color: Colors[theme].icon }]}>Power</ThemedText>
                        <ThemedText style={styles.statText}>{cardDetail.power}</ThemedText>
                    </View>
                )}
                <View style={{ alignItems: "center" }}>
                    <ThemedText style={[styles.statTitle, { color: Colors[theme].icon }]}>Counter</ThemedText>
                    <ThemedText style={styles.statText}>
                        {cardDetail.counter !== "-" ? `+${cardDetail.counter}` : ""}
                    </ThemedText>
                </View>
                <View style={styles.codeRarityContainer}>
                    <ThemedText style={styles.codeText}>{cardDetail.code}</ThemedText>
                    <ThemedText style={[styles.rarityText, { backgroundColor: dividerStyle.color }]}>
                        {cardDetail.rarity}
                    </ThemedText>
                </View>
            </View>

            {/* Columna Derecha (Imagen) */}
            <Image source={{ uri: cardDetail.images_large }} style={styles.cardImage} />
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
        gap: 10,
    },
    statsContainer: {
        flex: 1,
        justifyContent: "space-between",
        alignItems: "center",
        height: 320,
        paddingTop: 12,
        paddingBottom: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
    },
    attributeImage: {
        width: 24,
        height: 24,
    },
    statTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginVertical: 2,
    },
    statText: {
        fontSize: 22,
        fontWeight: "600",
        letterSpacing: 2,
    },
    statType: {
        fontSize: 18,
        fontWeight: "600",
    },
    codeRarityContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
    },
    codeText: {
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
    },
    rarityText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#FFFFFF",
        position: "absolute",
        bottom: 0,
        right: 0,
        paddingHorizontal: 6,
        paddingVertical: 0,
        borderRadius: 5,
    },
    attributeText: {
        marginTop: -6,
        marginBottom: -6,
        fontSize: 10,
    },
    cardImage: {
        width: 224,
        height: 320,
        borderRadius: 10,
    },
});

export default CardStats;
