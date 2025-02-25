import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import avatars from "@/utils/avatarLoader";
import { db } from "@/firebaseConfig";
import { collection, addDoc, doc, updateDoc, onSnapshot, getDoc, deleteDoc } from "firebase/firestore";
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

  // Load Font
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

  // Generate Unique Player ID
  useEffect(() => {
    if (!playerId) {
      setPlayerId(`${playerName}_${Math.random().toString(36).substr(2, 5)}`);
    }
  }, [playerName]);

  // Fetch available game rooms (with status "waiting")
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "games"), (snapshot) => {
      const activeGames = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(game => game.status === "waiting");
      setAvailableRooms(activeGames);
    });

    return () => unsubscribe();
  }, []);

  // Host a new game
  const hostGame = async () => {
    if (!playerName) return alert("Enter a name first!");

    // Create game with the host as first player
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

  // Join an existing game, but enforce max 4 players
  const joinGame = async (id) => {
    if (!playerName) return alert("Enter a name first!");

    const gameRef = doc(db, "games", id);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) {
      alert("Game not found!");
      return;
    }

    const gameData = gameSnap.data();

    // Enforce max 4 players on the frontend
    if (gameData.players && gameData.players.length >= 4) {
      alert("Game is full (maximum 4 players allowed).");
      return;
    }

    setGameId(id);
    const newPlayer = { id: playerId, name: playerName, avatar: selectedAvatar };

    // Prevent duplicate players
    if (!gameData.players.find(p => p.id === newPlayer.id)) {
      const updatedPlayers = [...gameData.players, newPlayer];
      await updateDoc(gameRef, { players: updatedPlayers });
      setPlayers(updatedPlayers);
    }

    setHostId(gameData.hostId);
  };

  // Listen for real-time updates (player list, game start, host leaving)
  useEffect(() => {
    if (!gameId) return;
    const unsubscribe = onSnapshot(doc(db, "games", gameId), async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setPlayers(data.players || []);

        // If the host leaves, delete the game and kick everyone out
        if (!data.players.find(p => p.id === data.hostId)) {
          await deleteDoc(doc(db, "games", gameId));
          alert(t("game_closed"));
          router.replace("/");
        }

        // Redirect to game screen when host starts
        if (data.status === "started") {
          router.push(`/game?roomId=${gameId}&playerId=${playerId}`);
        }
      }
    });

    return () => unsubscribe();
  }, [gameId]);

  // Leave Game
  const leaveGame = async () => {
    Alert.alert(
      t("leave_game"),
      t("confirm_leave"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("leave"),
          style: "destructive",
          onPress: async () => {
            if (!gameId) return;
            const gameRef = doc(db, "games", gameId);
            const gameSnap = await getDoc(gameRef);

            if (!gameSnap.exists()) return;

            const updatedPlayers = gameSnap.data().players.filter(p => p.id !== playerId);
            await updateDoc(gameRef, { players: updatedPlayers });

            // If the host leaves, delete the game and kick everyone out
            if (playerId === hostId) {
              await deleteDoc(gameRef);
              alert(t("game_closed"));
              router.replace("/");
              return;
            }

            router.replace("/");
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>{t("multiplayer_lobby")}</Text>

      {gameId ? (
        <>
          <Text>{t("game_id")}: {gameId}</Text>
          <Text>{t("host")}: {hostId}</Text>

          {/* Show Player List with Avatars */}
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

          {/* Host can start game if there are at least 2 players */}
          {isHost && players.length >= 2 ? (
            <TouchableOpacity style={styles.button} onPress={() => updateDoc(doc(db, "games", gameId), { status: "started" })}>
              <Text style={styles.buttonText}>{t("start_game")}</Text>
            </TouchableOpacity>
          ) : (
            <Text>{isHost ? t("waiting_for_players") : t("waiting_for_host")}</Text>
          )}

          {/* Leave Game Button */}
          <TouchableOpacity style={styles.leaveButton} onPress={leaveGame}>
            <Text style={styles.buttonText}>{t("leave_game")}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity style={styles.button} onPress={hostGame}>
            <Text style={styles.buttonText}>{t("Host Game")}</Text>
          </TouchableOpacity>
          <Text style={styles.subHeader}>{t("Available Games")}</Text>
          {availableRooms.length > 0 ? (
            <FlatList
              data={availableRooms}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                console.log("Item players:", item.players);
                return (
                  <TouchableOpacity style={styles.roomItem} onPress={() => joinGame(item.id)}>
                    <View style={styles.lobbyAvatarGrid}>
                      {item.players.map((player, index) => (
                        <Image
                          key={index}
                          source={avatars[player.avatar]}
                          style={styles.lobbyAvatar}
                        />
                      ))}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />


          ) : (
            <Text style={styles.noRooms}>{t("no_games_available")}</Text>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  header: { fontSize: 24, fontFamily: "PressStart2P", textAlign: "center", marginBottom: 20 },
  playerRow: { flexDirection: "row", alignItems: "center", marginVertical: 5 },
  playerAvatar: { width: 50, height: 50, marginRight: 10 },
  lobbyAvatarGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginVertical: 5, },
  lobbyAvatar: {
    width: 100,
    height: 100,
    marginRight: 5,
    marginLeft: 5,
    borderWidth: 4,
    borderTopColor: "#404040",   // dark on top
    borderLeftColor: "#404040",  // dark on left
    borderBottomColor: "#fff",   // light on bottom
    borderRightColor: "#fff",    // light on right
  },
    playerText: { fontFamily: "PressStart2P", fontSize: 12 },
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
  }, buttonText: { color: "#fff", fontFamily: "PressStart2P" },
  leaveButton: { backgroundColor: "red", padding: 10, marginVertical: 10, borderRadius: 5 },
  subHeader: { fontSize: 16, fontFamily: "PressStart2P", textAlign: "center", marginVertical: 10 },
  roomItem: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#c3c3c3",
    padding: 10,
    borderRadius: 3,
    marginVertical: 5,
    borderWidth: 4,
    borderLeftColor: "#fff",
    borderTopColor: "#fff",
    borderRightColor: "#404040",
    borderBottomColor: "#404040",
  },
  roomText: { color: "#fff", fontFamily: "PressStart2P" },
  noRooms: { fontFamily: "PressStart2P", fontSize: 14, color: "#000" },
});
