import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, FlatList, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { useFonts } from "expo-font"; // ✅ Import font loader
import * as SplashScreen from "expo-splash-screen"; // ✅ Prevent flickering
import { db } from "@/firebaseConfig";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import CustomButton from "@/components/CustomButton";
import DraggableCard from "@/components/DraggableCard";

// Prevent splash screen from hiding before font loads
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

  // 🔹 Fetch game state
  useEffect(() => {
    if (!roomId) return;
    const gameRef = doc(db, "games", roomId);

    const unsubscribe = onSnapshot(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        setPlayers(snapshot.data().players);
        setGameStatus(snapshot.data().status);
      } else {
        alert("Game session not found!");
        router.push("/lobby");
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // 🔹 Show "Waiting for Host" if game hasn’t started yet
  if (gameStatus !== "started") {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.header, { color: colors.text }]}>
          {t("waiting_for_host")}
        </Text>
      </SafeAreaView>
    );
  }

  // 🔹 Game UI when game starts
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.innerContainer}>
        <Text style={[styles.header, { color: colors.text }]}>{t("game_started")}</Text>
        <FlatList
          data={players}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <Text style={[styles.player, { color: colors.text }]}>{item}</Text>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

// ✅ Apply font globally to all text
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  innerContainer: { width: "100%", padding: 20, alignItems: "center" },
  header: {
    fontSize: 20,
    fontFamily: "PressStart2P", // ✅ Apply font here
    textAlign: "center",
    marginBottom: 10,
  },
  player: {
    fontSize: 16,
    fontFamily: "PressStart2P", // ✅ Apply font here
    textAlign: "center",
    marginBottom: 5,
  },
});
