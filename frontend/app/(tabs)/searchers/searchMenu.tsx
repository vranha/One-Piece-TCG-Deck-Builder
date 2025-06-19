import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/ThemeContext";
import { Colors } from "@/constants/Colors";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import IconCard from '@/assets/icons/IconCardFill.svg';
import IconCards from '@/assets/icons/IconCards.svg';
import IconUser from '@/assets/icons/iconUser.svg';

export default function SearchMenu() {
    const router = useRouter();
    const navigation = useNavigation();
    const { theme } = useTheme();
    const { t } = useTranslation();

    React.useEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity onPress={() => router.back()} style={{ paddingLeft: 12 }}>
                    <Ionicons name="arrow-back" size={24} color={Colors[theme].text} />
                </TouchableOpacity>
            ),
            headerTitle: "",
            headerShadowVisible: false,
            headerStyle: { backgroundColor: Colors[theme].background },
        });
    }, [navigation, theme]);

    return (
        <View style={styles.container}>
            {/* 🟦 Nueva fila de dos botones */}
            <View style={styles.row}>
                <TouchableOpacity
                    style={[
                        styles.smallButton,
                        {
                            backgroundColor: Colors[theme].background,
                            borderColor: Colors[theme].TabBarBackground,
                        },
                    ]}
                    onPress={() => router.push("/deckSearcher")}
                >
                    <IconCards style={{ color: Colors[theme].info, width: 80, height: 80, marginBottom:-10}} />
                    <ThemedText style={[styles.buttonText, { color: Colors[theme].text, marginBottom:10 }]}>{t("decks")}</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.smallButton,
                        {
                            backgroundColor: Colors[theme].background,
                            borderColor: Colors[theme].TabBarBackground,
                        },
                    ]}
                    onPress={() => router.push({ pathname: "/deckSearcher", params: { showUsers: "true" } })}
                >
                    <IconUser style={{ color: Colors[theme].success, width: 60, height: 60}} />
                    <ThemedText style={[styles.buttonText, { color: Colors[theme].text }]}>{t("users")}</ThemedText>
                </TouchableOpacity>
            </View>

            {/* 🔲 Botón grande inferior */}
            <TouchableOpacity
                style={[
                    styles.button,
                    {
                        backgroundColor: Colors[theme].background,
                        borderColor: Colors[theme].TabBarBackground,
                    },
                ]}
                onPress={() => router.push("/search")}
            >
                {/* <MaterialIcons name="style" size={100} color={Colors[theme].tint} /> */}
                <IconCard style={{ color: Colors[theme].tint, width: 100, height: 100 }} />
                <ThemedText style={[styles.text, { color: Colors[theme].textSoft }]}>{t("cards")}</ThemedText>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent",
        paddingBottom: 100,
        gap: 30,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 20,
        width: "90%",
    },
    smallButton: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 18,
        borderWidth: 3,
        alignItems: "center",
        justifyContent: "center",
        padding: 10,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
    },
    buttonText: {
        marginTop: 8,
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
    },
    button: {
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        borderRadius: 18,
        marginVertical: 16,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        height: "40%",
        aspectRatio: 1,
        borderWidth: 3,
    },
    text: {
        fontSize: 22,
        fontWeight: "bold",
    },
});
