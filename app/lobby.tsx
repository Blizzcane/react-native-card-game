import React, { useEffect, useState, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
  StyleSheet,
  useWindowDimensions,
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

  // Load custom font
  const [fontsLoaded] = useFonts({
    "PressStart2P": require("../assets/fonts/PressStart2P-Regular.ttf"),
  });

  const { width, height } = useWindowDimensions();
  // Set your base design dimensions (e.g., iPhone 8 dimensions)
  const BASE_WIDTH = 375;
  const BASE_HEIGHT = 667;
  // Use the minimum scaling factor for a uniform scale
  const scale = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);

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
    if (!playerId && playerName) {
      setPlayerId(`${playerName}_${Math.random().toString(36).substr(2, 5)}`);
    }
  }, [playerName, playerId]);

  // Listen to available game rooms (only "waiting" status)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "games"), (snapshot) => {
      const activeGames = snapshot.docs
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
        .filter(game => game.status === "waiting");
      setAvailableRooms(activeGames);
    }, error => {
      console.error("Error fetching available games: ", error);
    });
    return () => unsubscribe();
  }, []);

  // Host a new game
  const hostGame = useCallback(async () => {
    if (!playerName) {
      return Alert.alert("Error", "Enter a name first!");
    }
    try {
      const newGameRef = await addDoc(collection(db, "games"), {
        players: [{ id: playerId, name: playerName, avatar: selectedAvatar }],
        status: "waiting",
        hostId: playerId,
      });
      setGameId(newGameRef.id);
      setHostId(playerId);
      setIsHost(true);
      // Automatically join the game after hosting
      joinGame(newGameRef.id);
    } catch (error) {
      console.error("Error hosting game:", error);
    }
  }, [playerName, playerId, selectedAvatar]);

  // Join an existing game (max 4 players enforced)
  const joinGame = useCallback(async (id) => {
    if (!playerName) {
      return Alert.alert("Error", "Enter a name first!");
    }
    try {
      const gameRef = doc(db, "games", id);
      const gameSnap = await getDoc(gameRef);
      if (!gameSnap.exists()) {
        return Alert.alert("Error", "Game not found!");
      }
      const gameData = gameSnap.data();
      if (gameData.players && gameData.players.length >= 4) {
        return Alert.alert("Info", "Game is full (maximum 4 players allowed).");
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
    } catch (error) {
      console.error("Error joining game:", error);
    }
  }, [playerName, playerId, selectedAvatar]);

  // Listen for real-time game updates
  useEffect(() => {
    if (!gameId) return;
    const gameRef = doc(db, "games", gameId);
    const unsubscribe = onSnapshot(gameRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setPlayers(data.players || []);
        // If host leaves, delete the game and notify players
        if (!data.players.find(p => p.id === data.hostId)) {
          try {
            await deleteDoc(gameRef);
            Alert.alert(t("game_closed"));
            router.replace("/");
          } catch (error) {
            console.error("Error deleting game after host left:", error);
          }
        }
        // Redirect to game screen when game starts
        if (data.status === "started") {
          router.push(`/game?roomId=${gameId}&playerId=${playerId}`);
        }
      }
    }, error => {
      console.error("Error listening to game updates:", error);
    });
    return () => unsubscribe();
  }, [gameId, playerId, router, t]);

  // Leave game function with confirmation
  const leaveGame = useCallback(async () => {
    let confirmed = false;
    if (Platform.OS === "web") {
      confirmed = window.confirm(t("Confirm"));
    } else {
      confirmed = await new Promise((resolve) => {
        Alert.alert(
          t("Leave Lobby"),
          t("Confirm"),
          [
            { text: t("cancel"), onPress: () => resolve(false), style: "cancel" },
            { text: t("leave"), onPress: () => resolve(true), style: "destructive" },
          ],
          { cancelable: false }
        );
      });
    }
    if (!confirmed || !gameId) return;
    try {
      const gameRef = doc(db, "games", gameId);
      const gameSnap = await getDoc(gameRef);
      if (!gameSnap.exists()) return;
      const updatedPlayers = gameSnap.data().players.filter(p => p.id !== playerId);
      await updateDoc(gameRef, { players: updatedPlayers });
      // If host leaves, delete game and redirect
      if (playerId === hostId) {
        await deleteDoc(gameRef);
        if (Platform.OS !== "web") {
          Alert.alert(t("game_closed"));
        }
        router.replace("/");
        return;
      }
      router.replace("/");
    } catch (error) {
      console.error("Error leaving game:", error);
    }
  }, [gameId, playerId, hostId, router, t]);

  return (
    <SafeAreaView style={styles.container(scale)}>
      <Text style={styles.header(scale)}>{t("Multiplayer Lobby")}</Text>
      {gameId ? (
        <>
          <Text style={styles.infoText(scale)}>{t("Game ID")}: {gameId}</Text>
          {/* Player List */}
          <FlatList
            data={players}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.playerRow(scale)}>
                <Image source={avatars[item.avatar]} style={styles.playerAvatar(scale)} />
                <Text style={styles.playerText(scale)}>
                  {item.name} {item.id === hostId ? "(Host)" : ""}
                </Text>
              </View>
            )}
          />
          {/* Host controls */}
          {isHost && players.length >= 2 ? (
            <TouchableOpacity
              style={styles.button(scale)}
              onPress={async () => {
                try {
                  await updateDoc(doc(db, "games", gameId), { status: "started" });
                } catch (error) {
                  console.error("Error starting game:", error);
                }
              }}
            >
              <Text style={styles.buttonText(scale)}>{t("Start Game")}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.infoText(scale)}>
              {isHost ? t("waiting for players") : t("waiting for host to start game")}
            </Text>
          )}
          {/* Leave Game Button */}
          <TouchableOpacity style={styles.leaveButton(scale)} onPress={leaveGame}>
            <Text style={styles.buttonText(scale)}>{t("Leave Lobby")}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity style={styles.button(scale)} onPress={hostGame}>
            <Text style={styles.buttonText(scale)}>{t("Host Game")}</Text>
          </TouchableOpacity>
          <Text style={styles.subHeader(scale)}>{t("Available Games")}</Text>
          {availableRooms.length > 0 ? (
            <FlatList
              data={availableRooms}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.roomItem(scale)}
                  onPress={() => joinGame(item.id)}
                >
                  <View style={styles.lobbyAvatarGrid(scale)}>
                    {item.players.map((player, index) => (
                      <Image
                        key={index}
                        source={avatars[player.avatar]}
                        style={styles.lobbyAvatar(scale)}
                      />
                    ))}
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <Text style={styles.noRooms(scale)}>{t("No Games Available")}</Text>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: (scale) => ({
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20 * scale,
  }),
  header: (scale) => ({
    fontSize: 24 * scale,
    fontFamily: "PressStart2P",
    textAlign: "center",
    marginVertical: 20 * scale,
    color: "#000",
  }),
  infoText: (scale) => ({
    fontSize: 16 * scale,
    fontFamily: "PressStart2P",
    marginVertical: 10 * scale,
    color: "#fff",
  }),
  playerRow: (scale) => ({
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5 * scale,
  }),
  playerAvatar: (scale) => ({
    width: 50 * scale,
    height: 50 * scale,
    marginRight: 10 * scale,
  }),
  playerText: (scale) => ({
    fontFamily: "PressStart2P",
    fontSize: 12 * scale,
    color: "#000",
  }),
  button: (scale) => ({
    backgroundColor: "#c3c3c3",
    padding: 10 * scale,
    marginVertical: 10 * scale,
    borderRadius: 3 * scale,
    borderWidth: 4 * scale,
    borderLeftColor: "#fff",
    borderTopColor: "#fff",
    borderRightColor: "#404040",
    borderBottomColor: "#404040",
  }),
  buttonText: (scale) => ({
    color: "#fff",
    fontFamily: "PressStart2P",
    fontSize: 14 * scale,
  }),
  leaveButton: (scale) => ({
    backgroundColor: "red",
    padding: 8 * scale,          // reduced padding
    marginVertical: 8 * scale,    // reduced margin
    borderRadius: 3 * scale,      // same border radius to keep the shape
    borderWidth: 3 * scale,       // reduced border width
    borderLeftColor: "#fff",
    borderTopColor: "#fff",
    borderRightColor: "#404040",
    borderBottomColor: "#404040",
  }),
  

  subHeader: (scale) => ({
    fontSize: 16 * scale,
    fontFamily: "PressStart2P",
    textAlign: "center",
    marginVertical: 10 * scale,
    color: "#000",
  }),
  roomItem: (scale) => ({
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#c3c3c3",
    padding: 10 * scale,
    borderRadius: 3 * scale,
    marginVertical: 5 * scale,
    borderWidth: 4 * scale,
    borderLeftColor: "#fff",
    borderTopColor: "#fff",
    borderRightColor: "#404040",
    borderBottomColor: "#404040",
  }),
  noRooms: (scale) => ({
    fontFamily: "PressStart2P",
    fontSize: 14 * scale,
    color: "#c3c3c3",
    textAlign: "center",
  }),
  lobbyAvatarGrid: (scale) => ({
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginVertical: 5 * scale,
  }),
  lobbyAvatar: (scale) => ({
    width: 100 * scale,
    height: 100 * scale,
    marginHorizontal: 5 * scale,
    borderWidth: 4 * scale,
    borderTopColor: "#404040",
    borderLeftColor: "#404040",
    borderBottomColor: "#fff",
    borderRightColor: "#fff",
  }),
});
