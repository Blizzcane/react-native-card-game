import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
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
    PressStart2P: require("../assets/fonts/PressStart2P-Regular.ttf"),
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
      <Text style={styles.header}>{t("Enter your name")}</Text>

      {/* Name Input */}
      <TextInput
        style={styles.input}
        placeholder={t("name")}
        value={playerName}
        onChangeText={setPlayerName}
      />

      {/* Avatar Selection */}
      <Text style={styles.subHeader}>{t("choose_avatar")}</Text>
      <FlatList
        data={Object.keys(avatars)}
        keyExtractor={(item) => item}
        numColumns={4} // Adjust the number of columns as needed
        contentContainerStyle={styles.avatarContainer}
        columnWrapperStyle={styles.avatarRow}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelectedAvatar(item)}>
            <Image
              source={avatars[item]}
              style={[
                styles.avatar,
                selectedAvatar === item && styles.selectedAvatar,
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
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  header: {
    fontSize: 20,
    fontFamily: "PressStart2P",
    textAlign: "center",
    marginBottom: 20,
  },
  subHeader: {
    fontSize: 16,
    fontFamily: "PressStart2P",
    textAlign: "center",
    marginVertical: 10,
  },
  input: {
    borderWidth: 2,
    padding: 10,
    width: "60%",
    marginVertical: 10,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#000",
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
  },
  buttonText: { color: "#fff", fontFamily: "PressStart2P" },
  avatar: { width: 100, height: 100, margin: 3, borderRadius: 0 },
  selectedAvatar: { borderWidth: 5, borderColor: "yellow" },
  avatarContainer: {
    width: "100%", // Make the container span the full width
    marginVertical: 10,
  },
  avatarRow: {
    width: "100%", // Each row takes up full width
    justifyContent: "space-evenly", // Evenly distribute the avatars across the row
  },
});
