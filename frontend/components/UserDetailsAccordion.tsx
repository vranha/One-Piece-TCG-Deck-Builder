import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet, Image, FlatList } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Accordion } from "@/components/Accordion";
import { Colors } from "@/constants/Colors";
import { supabase } from "@/supabaseClient";
import useStore from "@/store/useStore";

interface UserDetailsAccordionProps {
    username: string;
    setUsername: (value: string) => void;
    bio: string;
    setBio: (value: string) => void;
    location: string;
    setLocation: (value: string) => void;
    region: string;
    setRegion: (value: string) => void;
    avatar: string;
    setAvatar: (value: string) => void;
    handleUpdateUserDetails: () => void;
    theme: "light" | "dark";
    t: (key: string) => string;
    openAvatarModal: () => void; // New prop to open the avatar modal
}

export default function UserDetailsAccordion({
    username,
    setUsername,
    bio,
    setBio,
    location,
    setLocation,
    region,
    setRegion,
    avatar,
    setAvatar,
    handleUpdateUserDetails,
    theme,
    t,
    openAvatarModal,
}: UserDetailsAccordionProps) {
    const setAvatarUrl = useStore((state) => state.setAvatarUrl);

    const selectAvatar = (url: string) => {
        setAvatar(url);
        setAvatarUrl(url); // Actualiza el avatar global en Zustand
    };

    return (
        <Accordion title={t("user_details")}>
            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    marginBottom: 0,
                    gap: 30,
                    width: "100%",
                }}
            >
                <View style={[styles.inputContainer, { alignItems: "center" }]}>
                    <ThemedText style={[styles.label, { color: Colors[theme].tabIconDefault }]}>
                        {t("avatar")}
                    </ThemedText>
                    <TouchableOpacity onPress={openAvatarModal}>
                        <Image source={{ uri: avatar }} style={styles.avatar} />
                    </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                    <View style={styles.inputContainer}>
                        <ThemedText style={[styles.label, { color: Colors[theme].tabIconDefault }]}>
                            {t("name")}
                        </ThemedText>
                        <TextInput
                            style={[
                                styles.input,
                                { color: Colors[theme].text, borderColor: Colors[theme].tabIconDefault },
                            ]}
                            value={username}
                            onChangeText={setUsername}
                        />
                    </View>
                    <View style={styles.inputContainer}>
                        <ThemedText style={[styles.label, { color: Colors[theme].tabIconDefault }]}>
                            {t("location")}
                        </ThemedText>
                        <TextInput
                            style={[
                                styles.input,
                                { color: Colors[theme].text, borderColor: Colors[theme].tabIconDefault },
                            ]}
                            value={location}
                            onChangeText={setLocation}
                        />
                    </View>
                </View>
            </View>
            <View style={styles.inputContainer}>
                <ThemedText style={[styles.label, { color: Colors[theme].tabIconDefault }]}>{t("bio")}</ThemedText>
                <TextInput
                    style={[styles.textarea, { color: Colors[theme].text, borderColor: Colors[theme].tabIconDefault }]}
                    value={bio}
                    onChangeText={setBio}
                    multiline
                />
            </View>

            <View style={styles.regionContainer}>
                <TouchableOpacity
                    style={[
                        styles.regionButton,
                        { backgroundColor: Colors[theme].info },
                        region === "west" && styles.activeRegion,
                    ]}
                    onPress={() => setRegion("west")}
                >
                    <ThemedText style={[styles.regionText, { color: Colors[theme].background }]}>
                        {t("west")}
                    </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.regionButton,
                        { backgroundColor: Colors[theme].highlight },
                        region === "east" && styles.activeRegion,
                    ]}
                    onPress={() => setRegion("east")}
                >
                    <ThemedText style={[styles.regionText, { color: Colors[theme].background }]}>
                        {t("east")}
                    </ThemedText>
                </TouchableOpacity>
            </View>
            <TouchableOpacity
                style={[styles.changeButton, { backgroundColor: Colors[theme].success }]}
                onPress={handleUpdateUserDetails} // Directly call the function
            >
                <ThemedText style={styles.changeButtonText}>{t("change")}</ThemedText>
            </TouchableOpacity>
        </Accordion>
    );
}

const styles = StyleSheet.create({
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        fontWeight: "bold",
    },
    textarea: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        height: 80,
    },
    regionContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginVertical: 15,
    },
    regionButton: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        alignItems: "center",
        marginHorizontal: 5,
        opacity: 0.5,
    },
    activeRegion: {
        opacity: 1,
    },
    regionText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    changeButton: {
        alignSelf: "flex-end",
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
        marginBottom: 30,
    },
    changeButtonText: {
        color: "#fff",
        fontSize: 14,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: "#ccc",
    },
    presetAvatar: {
        width: 80,
        height: 80,
        margin: 5,
        borderRadius: 40,
    },
});
