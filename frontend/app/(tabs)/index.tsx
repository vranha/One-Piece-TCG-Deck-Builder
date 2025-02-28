import React, { useEffect, useState } from "react";
import { StyleSheet, View, Image, ActivityIndicator } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/ThemeContext";
import { Colors } from "@/constants/Colors";
import { supabase } from "@/supabaseClient";

export default function HomeScreen() {
  const { theme } = useTheme();
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Session:", session); // Agrega este log para ver qué datos trae
      if (session && session.user) {
        const name =
          session.user.user_metadata.full_name ||
          session.user.user_metadata.name ||
          session.user.email;
        setUserName(name);
      }
      setLoading(false);
    }
    fetchUser();
  }, []);
  

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
        <ActivityIndicator size="large" color={Colors[theme].tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <View style={styles.welcomeContainer}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : null}
        <ThemedText type="title" style={[styles.title, { color: Colors[theme].text }]}>
          Bienvenido, {userName}
        </ThemedText>
        <ThemedText type="subtitle" style={[styles.subtitle, { color: Colors[theme].icon }]}>
          ¡Explora y disfruta del juego!
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  welcomeContainer: {
    alignItems: "center",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
  },
});
