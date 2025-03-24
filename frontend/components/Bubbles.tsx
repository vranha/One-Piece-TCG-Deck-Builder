import React from "react";
import { View, StyleSheet, Animated, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import { useTranslation } from "react-i18next";

interface BubblesProps {
    blurAnim: Animated.Value;
    bubbleAnim: Animated.Value;
    bubbleRefs: React.MutableRefObject<Animated.Value[]>;
    toggleBubbles: () => void;
    onBubblePress: (index: number) => void;
}

type CustomIconNames =
    | "arrow.down.doc.fill"
    | "note.text"
    | "folder.fill"
    | "heart.fill"
    | "plus.square.fill"
    | "questionmark";

export default function Bubbles({ blurAnim, bubbleAnim, bubbleRefs, toggleBubbles, onBubblePress }: BubblesProps) {
    const { theme } = useTheme();
    const { t } = useTranslation();

    return (
        <>
            <Animated.View style={[styles.overlay, { opacity: blurAnim }]}>
                <TouchableOpacity style={styles.overlayTouchable} activeOpacity={1} onPress={toggleBubbles} />
            </Animated.View>
            <Animated.View
                style={[
                    styles.bubblesContainer,
                    {
                        transform: [
                            {
                                translateY: bubbleAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [80, 0],
                                }),
                            },
                            {
                                scale: bubbleAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.5, 1],
                                }),
                            },
                        ],
                        opacity: bubbleAnim,
                    },
                ]}
            >
                {bubbleRefs.current.map((anim, index) => (
                    <Animated.View
                        key={index}
                        style={[
                            styles.bubble,
                            {
                                backgroundColor: Colors[theme].TabBarBackground,
                                opacity: anim,
                                transform: [
                                    {
                                        scale: anim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.5, 1],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        <TouchableOpacity
                            onPress={() => onBubblePress(index)}
                            style={{ flexDirection: "row", alignItems: "center" }}
                        >
                            <IconSymbol name={getBubbleIconName(index)} size={24} color={Colors[theme].tint} />
                            <ThemedText
                                type="defaultSemiBold"
                                lightColor={Colors[theme].text}
                                darkColor={Colors[theme].text}
                                style={{ marginLeft: 8 }}
                            >
                                {t(getBubbleText(index))}
                            </ThemedText>
                        </TouchableOpacity>
                    </Animated.View>
                ))}
            </Animated.View>
        </>
    );
}

function getBubbleIconName(index: number): CustomIconNames {
    switch (index) {
        case 0:
            return "arrow.down.doc.fill";
        case 1:
            return "note.text";
        case 2:
            return "folder.fill";
        case 3:
            return "heart.fill";
        case 4:
            return "plus.square.fill";
        default:
            return "questionmark";
    }
}

function getBubbleText(index: number): string {
    switch (index) {
        case 0:
            return "import_deck";
        case 1:
            return "new_note";
        case 2:
            return "new_collection";
        case 3:
            return "new_wishlist";
        case 4:
            return "new_deck_bubble";
        default:
            return "unknown";
    }
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        position: "absolute",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
    },
    overlayTouchable: {
        ...StyleSheet.absoluteFillObject,
    },
    bubblesContainer: {
        position: "absolute",
        bottom: 80,
        right: 20,
        alignItems: "flex-end",
        flexDirection: "column-reverse",
    },
    bubble: {
        flexDirection: "row",
        padding: 15,
        borderRadius: 15,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 2, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
});
