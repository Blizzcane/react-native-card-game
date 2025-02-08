import React, { useEffect, useState } from "react";
import { View, Text, Button, FlatList, StyleSheet, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { db } from "@/firebaseConfig";
import { collection, addDoc, onSnapshot, deleteDoc, doc, getDocs } from "firebase/firestore";

export default function LobbyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [players, setPlayers] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);

  // Listen for real-time updates from Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "lobby"), (snapshot) => {
      setPlayers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // Join the game (only if there are fewer than 4 players)
  const joinGame = async () => {
    if (players.length >= 4) {
      Alert.alert(t("max_players"));
      return;
    }
    const playerNumber = players.length + 1;
    await addDoc(collection(db, "lobby"), { name: t("player", { number: playerNumber }) });
  };

  // Start the game (only if there are at least 2 players)
  const startGame = async () => {
    if (players.length < 2) {
      Alert.alert(t("min_players"));
      return;
    }
    setGameStarted(true);
  
    players.forEach(async (player) => await deleteDoc(doc(db, "lobby", player.id)));
    router.push({ pathname: "/game", params: { playerCount: players.length } });
  };
  

  // Reset the game (clears all players)
  const resetGame = async () => {
    const querySnapshot = await getDocs(collection(db, "lobby"));
    querySnapshot.forEach(async (player) => {
      await deleteDoc(doc(db, "lobby", player.id));
    });
    Alert.alert(t("game_reset")); // Confirmation message
  };

  if (gameStarted) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>{t("multiplayer_lobby")}</Text>
        <Text>Shuffling cards...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t("multiplayer_lobby")}</Text>
      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text style={styles.player}>{item.name}</Text>}
      />
      <Button title={t("join_game")} onPress={joinGame} />
      {players.length >= 2 && <Button title={t("start_game")} onPress={startGame} />}
      <Button title="Reset Game" onPress={resetGame} color="red" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  player: { fontSize: 18, padding: 5 },
});
