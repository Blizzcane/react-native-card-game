import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();

  // ✅ Load the font
  const [fontsLoaded] = useFonts({
    "PressStart2P": require("../assets/fonts/PressStart2P-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null; // Prevent UI rendering until font loads
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>{t("welcome")}</Text>

      {/* 🔹 Redirect players to the setup screen first */}
      <TouchableOpacity style={styles.button} onPress={() => router.push("/PlayerSetup")}>
        <Text style={styles.buttonText}>{t("go_to_lobby")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { fontSize: 20, fontFamily: "PressStart2P", textAlign: "center", marginBottom: 20 },
  button: { backgroundColor: "#000", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5, marginVertical: 5 },
  buttonText: { fontSize: 14, fontFamily: "PressStart2P", color: "#fff", textAlign: "center" },
});
