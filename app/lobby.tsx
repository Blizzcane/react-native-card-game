import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { db } from "@/firebaseConfig"; 
import { collection, addDoc, doc, updateDoc, onSnapshot, getDoc } from "firebase/firestore";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function LobbyScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [gameId, setGameId] = useState("");
  const [players, setPlayers] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [gameStatus, setGameStatus] = useState("waiting");

  // 🔹 Load the font
  const [fontsLoaded] = useFonts({
    "PressStart2P": require("../assets/fonts/PressStart2P-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null; // Ensure nothing renders before fonts load
  }

  // 🔹 Fetch available game rooms
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "games"), (snapshot) => {
      const activeGames = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(game => game.status === "waiting"); 
      setAvailableRooms(activeGames);
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Host a new game
  const hostGame = async () => {
    const gameRef = await addDoc(collection(db, "games"), {
      players: [],
      status: "waiting",
    });
    setGameId(gameRef.id);
    setIsHost(true);
    joinGame(gameRef.id);
  };

  // 🔹 Join an existing game
  const joinGame = async (id) => {
    const gameRef = doc(db, "games", id);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) {
      alert("Game not found!");
      return;
    }

    setGameId(id);
    const gameData = gameSnap.data();

    if (!gameData.players.includes(`Player_${Math.random().toString(36).substr(2, 5)}`)) {
      await updateDoc(gameRef, {
        players: [...gameData.players, `Player_${Math.random().toString(36).substr(2, 5)}`],
      });
    }
  };

  // 🔹 Start the game (Host only)
  const startGame = async () => {
    if (isHost && players.length >= 2) {
      await updateDoc(doc(db, "games", gameId), { status: "started" });
    } else {
      alert("Only the host can start the game, and you need at least 2 players.");
    }
  };

  // 🔹 Listen for game status updates
  useEffect(() => {
    if (!gameId) return;
    const unsubscribe = onSnapshot(doc(db, "games", gameId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setPlayers(data.players || []);
        setGameStatus(data.status);

        if (data.status === "started") {
          router.push(`/game?roomId=${gameId}`);
        }
      }
    });
    return () => unsubscribe();
  }, [gameId]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t("multiplayer_lobby")}</Text>

      {gameId ? (
        <>
          <Text style={styles.subHeader}>{t("game_id")}: {gameId}</Text>
          <FlatList
            data={players}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => <Text style={styles.player}>{item}</Text>}
          />
          {isHost && players.length >= 2 ? (
            <TouchableOpacity style={styles.button} onPress={startGame}>
              <Text style={styles.buttonText}>{t("start_game")}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.waitingText}>
              {isHost ? t("waiting_for_players") : t("waiting_for_host")}
            </Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  header: { 
    fontSize: 20, 
    fontFamily: "PressStart2P", 
    textAlign: "center", 
    marginBottom: 20, 
    color: "#FFF" 
  },
  subHeader: { 
    fontSize: 14, 
    fontFamily: "PressStart2P", 
    marginBottom: 10, 
    color: "#FFF",
    textAlign: "center"
  },
  waitingText: {
    fontSize: 12,
    fontFamily: "PressStart2P",
    color: "#FFD700",
    textAlign: "center",
    marginTop: 10,
  },
  noRooms: { 
    fontSize: 12, 
    fontFamily: "PressStart2P", 
    color: "#AAA", 
    marginTop: 10, 
    textAlign: "center"
  },
  roomItem: { 
    padding: 10, 
    backgroundColor: "#000", 
    borderRadius: 5, 
    marginTop: 5,
  },
  roomText: { 
    fontSize: 12, 
    fontFamily: "PressStart2P", 
    color: "#FFD700", 
    textAlign: "center"
  },
  player: { 
    fontSize: 14, 
    fontFamily: "PressStart2P", 
    color: "#FFF", 
    marginVertical: 5 
  },
  button: {
    backgroundColor: "#000",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginVertical: 5,
  },
  buttonText: {
    fontSize: 14,
    fontFamily: "PressStart2P",
    color: "#FFF",
    textAlign: "center",
  },
});
