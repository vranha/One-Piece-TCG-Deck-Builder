import React, { useState, useRef, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";

interface AccordionProps {
    title: string;
    children: React.ReactNode;
}

export const Accordion: React.FC<AccordionProps> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { theme } = useTheme();
    const animation = useRef(new Animated.Value(0)).current;
    const contentRef = useRef<View>(null);
    const [contentHeight, setContentHeight] = useState(0);

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.measure((x, y, width, height) => {
                setContentHeight(height);
            });
        }
    }, [children]);

    const toggleAccordion = () => {
        setIsOpen((prev) => !prev);
        Animated.timing(animation, {
            toValue: isOpen ? 0 : 1,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const heightInterpolation = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, contentHeight],
    });

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].TabBarBackground }]}>
            <TouchableOpacity style={styles.header} onPress={toggleAccordion}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="person" size={24} color={Colors[theme].icon} />
                    <ThemedText style={styles.title}>{title}</ThemedText>
                </View>
                <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color={Colors[theme].icon} />
            </TouchableOpacity>
            <Animated.View
                style={[
                    styles.content,
                    {
                        height: heightInterpolation,
                        overflow: "hidden",
                        alignItems: "center",
                        justifyContent: isOpen ? "flex-start" : "center",
                        padding: isOpen ? 15 : 0, // Remove padding when closed
                    },
                ]}
            >
                <View
                    ref={contentRef}
                    style={{
                        position: "absolute",
                        opacity: 0,
                        width: "100%", // Ensure proper measurement
                    }}
                >
                    {children}
                </View>
                {isOpen && <View style={{ width: "100%" }}>{children}</View>}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 15,
        borderRadius: 8,
        overflow: "hidden",
        elevation: 2,
        width: "100%",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 15,
    },
    title: {
        fontSize: 16,
    },
    content: {
        padding: 15,
    },
});
