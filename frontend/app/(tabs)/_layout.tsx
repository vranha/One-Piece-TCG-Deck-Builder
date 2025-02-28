import { Tabs, useRouter } from "expo-router";
import React, { useState, useRef } from "react";
import { Platform, View, StyleSheet, Animated } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Modalize } from "react-native-modalize";

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import Header from "@/components/Header";
import TabBarButton from "@/components/TabBarButton";
import Bubbles from "@/components/Bubbles";
import Modal from "@/components/Modal";
import { IconSymbol } from "@/components/ui/IconSymbol";

export default function TabLayout() {
    const { theme } = useTheme();
    const router = useRouter();
    const [showBubbles, setShowBubbles] = useState(false);
    const blurAnim = useRef(new Animated.Value(0)).current;
    const bubbleAnim = useRef(new Animated.Value(0)).current;
    const bubbleRefs = useRef([
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
    ]);
    const modalizeRef = useRef<Modalize>(null);

    const toggleBubbles = () => {
        if (showBubbles) {
            Animated.timing(bubbleAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() =>
                setShowBubbles(false)
            );
            bubbleRefs.current.forEach((anim) =>
                Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }).start()
            );
            Animated.timing(blurAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
        } else {
            setShowBubbles(true);
            const animations = bubbleRefs.current.map((anim, index) =>
                Animated.sequence([
                    Animated.delay(index * 100),
                    Animated.spring(anim, { toValue: 1, friction: 5, useNativeDriver: true }),
                ])
            );
            Animated.parallel(animations).start();
            Animated.spring(bubbleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
            Animated.timing(blurAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        }
    };

    const openModal = (e: any) => {
        e.persist();
        e.preventDefault();
        modalizeRef.current?.open();
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
                <Tabs
                    screenOptions={{
                        tabBarActiveTintColor: Colors[theme].text,
                        headerShown: false,
                        tabBarButton: HapticTab,
                        tabBarBackground: TabBarBackground,
                        tabBarStyle: [
                            {
                                backgroundColor: Colors[theme].TabBarBackground,
                                height: 65,
                                position: "absolute",
                            },
                            Platform.select({
                                ios: { position: "absolute" },
                                default: {},
                            }),
                        ],
                    }}
                >
                    <Tabs.Screen
                        name="index"
                        options={{
                            tabBarShowLabel: false,
                            title: "OP Lab",
                            tabBarButton: (props) => <TabBarButton {...props} name="house.fill" />,
                            headerShown: true,
                            headerTitleAlign: "center",
                            headerTitle: () => <Header title="OP Lab" />,
                            headerLeft: () => <Header.LeftButton />,
                            headerRight: () => (
                                <>
                                    <Header.RightButtonSearch onPress={() => router.push("../search")} />
                                    <Header.RightButton onPress={() => router.push("../settings")} />
                                </>
                            ),
                            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
                        }}
                    />
                    <Tabs.Screen
                        name="chat"
                        options={{
                            title: "Chat",
                            tabBarButton: (props) => (
                                <TabBarButton {...props} name="forum.fill" isChatButton onPress={openModal} />
                            ),
                        }}
                    />
                    <Tabs.Screen
                        name="plus"
                        options={{
                            title: "",
                            tabBarButton: (props) => (
                                <TabBarButton {...props} name="plus.circle.fill" onPress={toggleBubbles} />
                            ),
                        }}
                    />
                </Tabs>

                {showBubbles && (
                    <Bubbles
                        blurAnim={blurAnim}
                        bubbleAnim={bubbleAnim}
                        bubbleRefs={bubbleRefs}
                        toggleBubbles={toggleBubbles}
                    />
                )}
                <Modal ref={modalizeRef} />
            </View>
        </GestureHandlerRootView>
    );
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
});