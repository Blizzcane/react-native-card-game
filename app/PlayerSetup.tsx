import React, { useState, useEffect } from "react";
import { SafeAreaView, View, Text, TextInput, FlatList, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import avatars from "@/utils/avatarLoader"; // Avatar list
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function PlayerSetupScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [playerName, setPlayerName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("Z1"); // Default avatar

  // ✅ Load font
  const [fontsLoaded] = useFonts({
    "PressStart2P": require("../assets/fonts/PressStart2P-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null; // Prevent UI from loading until font is ready
  }

  // 🔹 Handle "Continue" button - Ensure name & avatar are selected
  const enterLobby = () => {
    if (!playerName.trim()) {
      alert("Please enter a name!");
      return;
    }

    // Move to the lobby and pass player data
    router.push({
      pathname: "/lobby",
      params: { playerName, selectedAvatar },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>{t("enter_name")}</Text>

      {/* Name Input */}
      <TextInput
        style={styles.input}
        placeholder={t("enter_name")}
        value={playerName}
        onChangeText={setPlayerName}
      />

      {/* Avatar Selection */}
      <Text style={styles.subHeader}>{t("choose_avatar")}</Text>
      <FlatList
        data={Object.keys(avatars)}
        horizontal
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelectedAvatar(item)}>
            <Image
              source={avatars[item]}
              style={[
                styles.avatar,
                selectedAvatar === item ? styles.selectedAvatar : {},
              ]}
            />
          </TouchableOpacity>
        )}
      />

      {/* Continue Button */}
      <TouchableOpacity style={styles.button} onPress={enterLobby}>
        <Text style={styles.buttonText}>{t("continue")}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  header: { fontSize: 20, fontFamily: "PressStart2P", textAlign: "center", marginBottom: 20 },
  subHeader: { fontSize: 16, fontFamily: "PressStart2P", textAlign: "center", marginVertical: 10 },
  input: { borderWidth: 1, padding: 10, width: "80%", marginVertical: 10, textAlign: "center" },
  button: { backgroundColor: "#000", padding: 10, marginVertical: 10, borderRadius: 5 },
  buttonText: { color: "#fff", fontFamily: "PressStart2P" },
  avatar: { width: 50, height: 50, margin: 5, borderRadius: 25 },
  selectedAvatar: { borderWidth: 2, borderColor: "blue" },
});
