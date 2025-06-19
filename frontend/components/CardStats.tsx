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
            <View
                style={[
                    styles.statsContainer,
                    {
                        backgroundColor: Colors[theme].background,
                        borderColor: Colors[theme].highlight,
                    },
                ]}
            >
                <View style={{ alignItems: "center", marginBottom: 8 }}>
                    <Image source={{ uri: cardDetail.attribute_image }} style={styles.attributeImage} />
                    <ThemedText style={styles.attributeText}>{cardDetail.attribute_name}</ThemedText>
                    <ThemedText type="subtitle" style={styles.statType}>
                        {cardDetail.type}
                    </ThemedText>
                </View>
                <View style={styles.statBlock}>
                    <ThemedText style={[styles.statTitle, { color: Colors[theme].icon }]}>Cost</ThemedText>
                    <ThemedText style={styles.statText}>{cardDetail.cost}</ThemedText>
                </View>
                {hasPower && (
                    <View style={styles.statBlock}>
                        <ThemedText style={[styles.statTitle, { color: Colors[theme].icon }]}>Power</ThemedText>
                        <ThemedText style={styles.statText}>{cardDetail.power}</ThemedText>
                    </View>
                )}
                <View style={styles.statBlock}>
                    <ThemedText style={[styles.statTitle, { color: Colors[theme].icon }]}>Counter</ThemedText>
                    <ThemedText style={styles.statText}>
                        {cardDetail.counter !== "-" ? `+${cardDetail.counter}` : ""}
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
        gap: 16,
    },
    statsContainer: {
        flex: 1,
        justifyContent: "space-between",
        alignItems: "center",
        height: 320,
        paddingTop: 18,
        paddingBottom: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 2,
        marginRight: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        backgroundColor: "#fff0",
    },
    statBlock: {
        alignItems: "center",
        marginVertical: 2,
        paddingVertical: 2,
        paddingHorizontal: 4,
        borderRadius: 8,
        backgroundColor: "rgba(0,0,0,0.03)",
        width: "100%",
        gap:2
    },
    attributeImage: {
        width: 28,
        height: 28,
        marginBottom: 2,
    },
    statTitle: {
        fontSize: 13,
        fontWeight: "600",
        marginVertical: 0,
        opacity: 0.8,
    },
    statText: {
        fontSize: 26,
        fontWeight: "700",
        lineHeight: 30,
    },
    statType: {
        fontSize: 15,
        fontWeight: "600",
        opacity: 0.7,
    },
 
    attributeText: {
        marginTop: -4,
        marginBottom: -4,
        fontSize: 11,
        opacity: 0.7,
    },
    cardImage: {
        width: 224,
        height: 320,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 4,
        backgroundColor: "#fff",
    },
});

export default CardStats;
