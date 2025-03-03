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

  // Handle "Continue" button - Ensure name & avatar are selected
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

      {/* Name Input */}
      <TextInput
        style={styles.input}
        placeholder={t("Enter Your Name")}
        value={playerName}
        onChangeText={setPlayerName}
      />

      {/* Avatar Selection */}
      <Text style={styles.subHeader}>{t("Pick an avatar")}</Text>
      <FlatList
        data={Object.keys(avatars)}
        keyExtractor={(item) => item}
        numColumns={4}
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
    backgroundColor: "#008183"
  },
  header: {
    fontSize: 20,
    fontFamily: "PressStart2P",
    textAlign: "center",
    marginBottom: 20,
    color: "#fff",
  },
  subHeader: {
    fontSize: 16,
    fontFamily: "PressStart2P",
    textAlign: "center",
    marginVertical: 10,
    color: "#fff",
  },
  input: {
    borderWidth: 2,
    padding: 10,
    width: "60%",
    marginVertical: 10,
    textAlign: "center",
    // Raised look for the input:
    borderLeftColor: "#fff",
    borderTopColor: "#fff",
    borderRightColor: "#404040",
    borderBottomColor: "#404040",
    backgroundColor: "#c3c3c3",
    color: "#000",
    fontFamily: "PressStart2P",
    fontSize: 15
  },
  button: {
    backgroundColor: "#c3c3c3",
    padding: 10,
    marginVertical: 10,
    borderRadius: 3,
    borderWidth: 4,
    borderLeftColor: "#fff",
    borderTopColor: "#fff",
    borderRightColor: "#404040",
    borderBottomColor: "#404040",
  },
  buttonText: {
    color: "#000",
    fontFamily: "PressStart2P",
    textAlign: "center",
  },
  avatarContainer: {
    width: "100%",
    backgroundColor: "#c3c3c3",
    marginVertical: 10,
    padding: 10,
    borderWidth: 5,
    borderLeftColor: "#fff",
    borderTopColor: "#fff",
    borderRightColor: "#404040",
    borderBottomColor: "#404040",
  },
  avatarRow: {
    width: "100%",
  },
  avatar: {
    width: 100,
    height: 100,
    margin: 3,
    // Sunken look for avatars:
    borderWidth: 4,
    borderTopColor: "#404040",
    borderLeftColor: "#404040",
    borderBottomColor: "#fff",
    borderRightColor: "#fff",
  },
  selectedAvatar: {
    borderWidth: 8,
    borderTopColor: "yellow",
    borderLeftColor: "yellow",
    borderBottomColor: "yellow",
    borderRightColor: "yellow",
  },
});

