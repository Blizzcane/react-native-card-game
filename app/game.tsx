import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, FlatList, StyleSheet, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { db } from "@/firebaseConfig";
import { doc, getDoc, onSnapshot, updateDoc, deleteDoc } from "firebase/firestore";
import avatars from "@/utils/avatarLoader";
import CustomButton from "@/components/CustomButton";
import ConfirmationDialog from "@/components/ConfirmationDialog"; // ✅ Import confirmation dialog component

SplashScreen.preventAutoHideAsync();

export default function GameScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { roomId, playerId } = useLocalSearchParams();
  const { colors } = useTheme();

  const [players, setPlayers] = useState([]);
  const [gameStatus, setGameStatus] = useState("waiting");
  const [hostId, setHostId] = useState("");
  const [showEndGamePrompt, setShowEndGamePrompt] = useState(false); // ✅ State for confirmation dialog

  // ✅ Load Press Start 2P Font
  const [fontsLoaded] = useFonts({
    "PressStart2P": require("../assets/fonts/PressStart2P-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  // ✅ Fetch game state
  useEffect(() => {
    if (!roomId) return;
    const gameRef = doc(db, "games", roomId);

    const unsubscribe = onSnapshot(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setPlayers(data.players);
        setGameStatus(data.status);
        setHostId(data.hostId);

        // ✅ If game is marked as "ending", auto-kick everyone to the main menu
        if (data.status === "ending") {
          router.replace("/");
        }
      } else {
        alert("Game session not found! Returning to lobby.");
        router.replace("/lobby");
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // ✅ End Game (Host Only) with Prompt
  const confirmEndGame = () => setShowEndGamePrompt(true);

  const endGame = async () => {
    if (playerId !== hostId) return; // Only host can end the game

    const gameRef = doc(db, "games", roomId);
    await updateDoc(gameRef, { status: "ending" }); // ✅ Mark game as ending

    // ✅ Wait briefly, then delete game data to clean up
    setTimeout(async () => {
      await deleteDoc(gameRef);
    }, 3000);
  };

  // ✅ Show "Waiting for Host" if game hasn’t started yet
  if (gameStatus !== "started") {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.header, { color: colors.text }]}>
          {t("waiting_for_host")}
        </Text>
      </SafeAreaView>
    );
  }

  // ✅ Game UI when game starts
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.innerContainer}>
        <Text style={[styles.header, { color: colors.text }]}>{t("game_started")}</Text>

        {/* ✅ Show Players with Avatars */}
        <FlatList
          data={players}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.playerRow}>
              <Image source={avatars[item.avatar]} style={styles.avatar} />
              <Text style={[styles.playerText, { color: colors.text }]}>
                {item.name} {item.id === hostId ? "(Host)" : ""}
              </Text>
            </View>
          )}
        />

        {/* ✅ End Game (Host Only) with Confirmation */}
        {playerId === hostId && (
          <CustomButton title={t("end_game")} onPress={confirmEndGame} />
        )}

        {/* ✅ End Game Confirmation Dialog */}
        {showEndGamePrompt && (
          <ConfirmationDialog
            message={t("confirm_end")}
            onConfirm={endGame}
            onCancel={() => setShowEndGamePrompt(false)}
          />
        )}
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
    fontFamily: "PressStart2P",
    textAlign: "center",
    marginBottom: 10,
  },
  playerRow: { flexDirection: "row", alignItems: "center", marginVertical: 5 },
  playerText: {
    fontSize: 16,
    fontFamily: "PressStart2P",
    textAlign: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    marginRight: 10,
    borderRadius: 20,
  },
});
