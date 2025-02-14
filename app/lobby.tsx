import React, { useEffect, useState } from "react";
import { 
  SafeAreaView, 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  StyleSheet 
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import avatars from "@/utils/avatarLoader"; // Avatar list
import { db } from "@/firebaseConfig";
import { collection, addDoc, doc, updateDoc, onSnapshot, getDoc } from "firebase/firestore";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function LobbyScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { playerName, selectedAvatar } = useLocalSearchParams();
  const [gameId, setGameId] = useState("");
  const [players, setPlayers] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [hostId, setHostId] = useState("");
  const [playerId, setPlayerId] = useState("");

  // ✅ Load Font
  const [fontsLoaded] = useFonts({
    "PressStart2P": require("../assets/fonts/PressStart2P-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null; // Prevent rendering until font loads
  }

  // 🔹 Generate Unique Player ID
  useEffect(() => {
    if (!playerId) {
      setPlayerId(`${playerName}_${Math.random().toString(36).substr(2, 5)}`);
    }
  }, [playerName]);

  // 🔹 Fetch available game rooms
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "games"), (snapshot) => {
      const activeGames = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(game => game.status === "waiting"); // Show only waiting rooms
      setAvailableRooms(activeGames);
    });

    return () => unsubscribe();
  }, []);

  // 🔹 Host a new game
  const hostGame = async () => {
    if (!playerName) return alert("Enter a name first!");

    const newGameRef = await addDoc(collection(db, "games"), {
      players: [{ id: playerId, name: playerName, avatar: selectedAvatar }],
      status: "waiting",
      hostId: playerId,
    });

    setGameId(newGameRef.id);
    setHostId(playerId);
    setIsHost(true);
    joinGame(newGameRef.id);
  };

  // 🔹 Join an existing game (Ensuring unique players)
  const joinGame = async (id) => {
    if (!playerName) return alert("Enter a name first!");

    const gameRef = doc(db, "games", id);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) {
      alert("Game not found!");
      return;
    }

    setGameId(id);
    const gameData = gameSnap.data();

    let newPlayer = { id: playerId, name: playerName, avatar: selectedAvatar };

    // ✅ Prevent duplicate players by checking IDs
    if (!gameData.players.find(p => p.id === newPlayer.id)) {
      const updatedPlayers = [...gameData.players, newPlayer];
      await updateDoc(gameRef, { players: updatedPlayers });
      setPlayers(updatedPlayers);
    }

    setHostId(gameData.hostId);
  };

  // 🔹 Listen for real-time updates (player list, game start)
  useEffect(() => {
    if (!gameId) return;
    const unsubscribe = onSnapshot(doc(db, "games", gameId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setPlayers(data.players || []);

        // ✅ Redirect all players to game screen when host starts the game
        if (data.status === "started") {
          router.push(`/game?roomId=${gameId}`);
        }
      }
    });

    return () => unsubscribe();
  }, [gameId]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>{t("multiplayer_lobby")}</Text>

      {gameId ? (
        <>
          <Text>{t("game_id")}: {gameId}</Text>
          <Text>{t("host")}: {hostId}</Text>

          {/* ✅ Show Player List with Avatars */}
          <FlatList
            data={players}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.playerRow}>
                <Image source={avatars[item.avatar]} style={styles.playerAvatar} />
                <Text style={styles.playerText}>{item.name} {item.id === hostId ? "(Host)" : ""}</Text>
              </View>
            )}
          />

          {/* ✅ Host Can Start Game */}
          {isHost && players.length >= 2 ? (
            <TouchableOpacity style={styles.button} onPress={() => updateDoc(doc(db, "games", gameId), { status: "started" })}>
              <Text style={styles.buttonText}>{t("start_game")}</Text>
            </TouchableOpacity>
          ) : (
            <Text>{isHost ? t("waiting_for_players") : t("waiting_for_host")}</Text>
          )}
        </>
      ) : (
        <>
          <TouchableOpacity style={styles.button} onPress={hostGame}>
            <Text style={styles.buttonText}>{t("host_game")}</Text>
          </TouchableOpacity>

          <Text style={styles.subHeader}>{t("available_games")}</Text>
          {availableRooms.length > 0 ? (
            <FlatList
              data={availableRooms}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.roomItem} onPress={() => joinGame(item.id)}>
                  <Text style={styles.roomText}>Game {item.id} ({item.players.length} players)</Text>
                </TouchableOpacity>
              )}
            />
          ) : (
            <Text style={styles.noRooms}>{t("no_games_available")}</Text>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

// ✅ Styles
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  header: { fontSize: 24, fontFamily: "PressStart2P", textAlign: "center", marginBottom: 20 },
  subHeader: { fontSize: 16, fontFamily: "PressStart2P", textAlign: "center", marginVertical: 10 },
  button: { backgroundColor: "#000", padding: 10, marginVertical: 10, borderRadius: 5 },
  buttonText: { color: "#fff", fontFamily: "PressStart2P" },
  roomItem: { padding: 10, backgroundColor: "#ddd", borderRadius: 5, marginTop: 5 },
  roomText: { fontSize: 16 },
  noRooms: { fontSize: 16, color: "gray", marginTop: 10 },
  playerRow: { flexDirection: "row", alignItems: "center", marginVertical: 5 },
  playerAvatar: { width: 30, height: 30, marginRight: 10 },
  playerText: { fontSize: 18, fontFamily: "PressStart2P" },
});
