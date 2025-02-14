import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, FlatList, StyleSheet, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { db } from "@/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import avatars from "@/utils/avatarLoader"; // ✅ Import avatar loader

// Prevent flickering while loading fonts
SplashScreen.preventAutoHideAsync();

export default function GameScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { roomId } = useLocalSearchParams();
  const { colors } = useTheme();

  const [players, setPlayers] = useState([]);
  const [gameStatus, setGameStatus] = useState("waiting");

  // ✅ Load Press Start 2P Font
  const [fontsLoaded] = useFonts({
    "PressStart2P": require("../assets/fonts/PressStart2P-Regular.ttf"),
  });

  // Hide splash screen once fonts are loaded
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // ✅ Prevent UI from rendering until font is loaded
  if (!fontsLoaded) {
    return null;
  }

  // 🔹 Fetch game state (players, status)
  useEffect(() => {
    if (!roomId) return;
    const gameRef = doc(db, "games", roomId);

    const unsubscribe = onSnapshot(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setPlayers(data.players || []);
        setGameStatus(data.status);
      } else {
        alert("Game session not found!");
        router.push("/lobby");
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // 🔹 If the game hasn’t started, show "Waiting for Host"
  if (gameStatus !== "started") {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.header, { color: colors.text }]}>{t("waiting_for_host")}</Text>
      </SafeAreaView>
    );
  }

  // 🔹 Game UI when the game starts
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.innerContainer}>
        <Text style={[styles.header, { color: colors.text }]}>{t("game_started")}</Text>
        
        {/* ✅ Display Players with Avatars */}
        <FlatList
          data={players}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.playerRow}>
              <Image source={avatars[item.avatar]} style={styles.playerAvatar} />
              <Text style={[styles.playerText, { color: colors.text }]}>{item.name}</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

// ✅ Apply font & styles to all text
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  innerContainer: { width: "100%", padding: 20, alignItems: "center" },
  header: {
    fontSize: 20,
    fontFamily: "PressStart2P", // ✅ Font applied
    textAlign: "center",
    marginBottom: 10,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    marginRight: 10,
    borderRadius: 20,
  },
  playerText: {
    fontSize: 16,
    fontFamily: "PressStart2P", // ✅ Font applied
    textAlign: "center",
  },
});

