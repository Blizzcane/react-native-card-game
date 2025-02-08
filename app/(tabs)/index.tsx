import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import "@/i18n"; // Ensure i18n is loaded

export default function HomeScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t("welcome")}</Text>
      <Button title={t("go_to_lobby")} onPress={() => router.push("/lobby")} />
      <Button title="🇬🇧 English" onPress={() => i18n.changeLanguage("en")} />
      <Button title="🇧🇬 Български" onPress={() => i18n.changeLanguage("bg")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
});
