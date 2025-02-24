import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import DraggableFlatList from "react-native-draggable-flatlist";
import { doc, updateDoc, onSnapshot, arrayUnion } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import avatars from "@/utils/avatarLoader";

const SUITS = ["hearts", "diamonds", "clubs", "spades"];
const RANKS = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

function generateDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

function shuffleArray(array: any[]) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function GameScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { roomId, playerId } = useLocalSearchParams();

  const [deck, setDeck] = useState<any[]>([]);
  const [discardPile, setDiscardPile] = useState<any[]>([]);
  const [playerHand, setPlayerHand] = useState<any[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [gameStatus, setGameStatus] = useState("waiting");
  const [players, setPlayers] = useState<any[]>([]);
  const [currentTurn, setCurrentTurn] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [playersReady, setPlayersReady] = useState<any[]>([]);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    const gameRef = doc(db, "games", roomId);
    const unsubscribe = onSnapshot(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setPlayers(data.players || []);
        setGameStatus(data.status);
        setCurrentRound(data.currentRound || 1);
        if (data.deck) setDeck(data.deck);
        if (data.discardPile) setDiscardPile(data.discardPile);
        if (data.hands && data.hands[playerId]) {
          setPlayerHand(data.hands[playerId]);
        }
        if (data.hostId === playerId) {
          setIsHost(true);
        }
        if (data.currentTurn) {
          setCurrentTurn(data.currentTurn);
        }
        setPlayersReady(data.playersReady || []);
      } else {
        Alert.alert("Game session not found!");
        router.replace("/lobby");
      }
    });
    return () => unsubscribe();
  }, [roomId]);

  // Helper function to update player's hand in Firebase
  const updateHandInDB = async (newHand: any[]) => {
    const gameRef = doc(db, "games", roomId);
    await updateDoc(gameRef, { [`hands.${playerId}`]: newHand });
  };

  const drawFromDeck = async () => {
    if (playerId !== currentTurn) {
      Alert.alert("Not your turn!");
      return;
    }
    if (hasDrawn) {
      Alert.alert("You have already drawn a card this turn!");
      return;
    }
    if (deck.length === 0) {
      Alert.alert("The deck is empty!");
      return;
    }
    const drawnCard = deck[0];
    const newDeck = deck.slice(1);
    const newHand = [...playerHand, drawnCard];
    setPlayerHand(newHand);
    setHasDrawn(true);
    const gameRef = doc(db, "games", roomId);
    await updateDoc(gameRef, {
      deck: newDeck,
      [`hands.${playerId}`]: newHand,
    });
  };

  const discardCard = async (cardIndex: number) => {
    if (playerId !== currentTurn) {
      Alert.alert("Not your turn!");
      return;
    }
    if (!hasDrawn) {
      Alert.alert("You must draw a card before discarding!");
      return;
    }
    if (playerHand.length === 0) return;
    const cardToDiscard = playerHand[cardIndex];
    if (!cardToDiscard) {
      Alert.alert("Invalid card selection.");
      return;
    }
    const newHand = [...playerHand];
    newHand.splice(cardIndex, 1);
    setPlayerHand(newHand);
    updateHandInDB(newHand);
    const newDiscardPile = [...discardPile, cardToDiscard];
    const currentIndex = players.findIndex((p) => p.id === currentTurn);
    const nextIndex = (currentIndex + 1) % players.length;
    const nextTurn = players[nextIndex]?.id;
    if (!nextTurn) {
      Alert.alert("Error determining next turn.");
      return;
    }
    const gameRef = doc(db, "games", roomId);
    await updateDoc(gameRef, {
      discardPile: newDiscardPile,
      currentTurn: nextTurn,
    });
    setHasDrawn(false);
  };

  // Render each card with reordering (via long press) and a discard button.
  const renderCard = ({ item, index, drag, isActive }: any) => {
    return (
      <TouchableOpacity
        style={[styles.card, isActive && styles.activeCard]}
        onLongPress={drag}
      >
        <Text style={styles.cardText}>
          {item.rank} of {item.suit}
        </Text>
        <TouchableOpacity
          style={styles.discardButton}
          onPress={() => discardCard(index)}
        >
          <Text style={styles.discardButtonText}>Discard</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>Round {currentRound}</Text>
      <View style={styles.avatarRow}>
        {players.map((player) => (
          <View
            key={player.id}
            style={[
              styles.avatarContainer,
              player.id === currentTurn && styles.currentTurnHighlight,
            ]}
          >
            <Image source={avatars[player.avatar]} style={styles.avatarImage} />
            <Text style={styles.avatarName}>{player.name}</Text>
          </View>
        ))}
      </View>
      <View style={styles.deckDiscardContainer}>
        <TouchableOpacity onPress={drawFromDeck} style={styles.deckCard}>
          <Text style={styles.cardText}>Deck ({deck.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deckCard}>
          {discardPile.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardText}>
                {discardPile[discardPile.length - 1].rank} of{" "}
                {discardPile[discardPile.length - 1].suit}
              </Text>
            </View>
          ) : (
            <Text style={styles.cardText}>Empty Discard</Text>
          )}
        </TouchableOpacity>
      </View>
      <Text style={[styles.subHeader, { color: colors.text }]}>Your Hand:</Text>
      <DraggableFlatList
        data={playerHand}
        horizontal
        keyExtractor={(item, index) => index.toString()}
        onDragEnd={({ data }) => {
          setPlayerHand(data);
          updateHandInDB(data);
        }}
        renderItem={renderCard}
      />
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            Alert.alert("Rump declared!", "Ending your turn and scoring this round.")
          }
        >
          <Text style={styles.actionText}>Rump!</Text>
        </TouchableOpacity>
      </View>
      {gameStatus === "roundEnded" && (
        <View style={styles.readyContainer}>
          {playersReady.includes(playerId) ? (
            <Text style={styles.readyText}>Waiting for others...</Text>
          ) : (
            <TouchableOpacity
              style={styles.hostButton}
              onPress={async () => {
                const gameRef = doc(db, "games", roomId);
                await updateDoc(gameRef, {
                  playersReady: arrayUnion(playerId),
                });
              }}
            >
              <Text style={styles.hostButtonText}>Start Next Round</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
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
  avatarRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    marginBottom: 20,
  },
  avatarContainer: { alignItems: "center", width: 100, padding: 5 },
  currentTurnHighlight: { borderWidth: 2, borderColor: "yellow" },
  avatarImage: { width: 80, height: 80 },
  avatarName: { fontFamily: "PressStart2P", fontSize: 10, marginTop: 5, color: "#000" },
  deckDiscardContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    marginVertical: 20,
  },
  deckCard: {
    width: 100,
    height: 140,
    backgroundColor: "#444",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
  },
  card: {
    width: 70,
    height: 100,
    backgroundColor: "#fff",
    borderColor: "#000",
    borderWidth: 1,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
    marginHorizontal: 5,
  },
  activeCard: { opacity: 0.7 },
  cardText: {
    fontFamily: "PressStart2P",
    fontSize: 12,
    textAlign: "center",
    color: "#000",
  },
  discardButton: {
    marginTop: 5,
    backgroundColor: "#f00",
    padding: 5,
    borderRadius: 3,
  },
  discardButtonText: {
    color: "#fff",
    fontFamily: "PressStart2P",
    fontSize: 10,
  },
  actions: { flexDirection: "row", marginVertical: 10 },
  actionButton: {
    backgroundColor: "#000",
    padding: 10,
    margin: 5,
    borderRadius: 5,
  },
  actionText: { color: "#fff", fontFamily: "PressStart2P" },
  hostButton: {
    backgroundColor: "#000",
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
  },
  hostButtonText: { color: "#fff", fontFamily: "PressStart2P" },
  readyContainer: { marginVertical: 10, alignItems: "center" },
  readyText: { fontFamily: "PressStart2P", fontSize: 12, color: "#000" },
});
