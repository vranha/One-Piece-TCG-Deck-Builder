// SettingsScreen.tsx
import { View, Switch, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/ThemeContext";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";

export default function SettingsScreen() {
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === "dark";

  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <ThemedText type="title" style={{ color: Colors[theme].text }}>Settings</ThemedText>
      <ThemedText style={{ color: Colors[theme].text }}>Dark Mode</ThemedText>
      <Switch value={isDarkMode} onValueChange={toggleTheme} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
