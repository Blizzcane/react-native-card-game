import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { db } from "@/firebaseConfig";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import avatars from "@/utils/avatarLoader";

SplashScreen.preventAutoHideAsync();

const suitSymbols = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

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

function shuffleArray(array) {
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

  const [deck, setDeck] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);
  // Using roundStatus for the round; possible values "waiting", "started", "gameOver"
  const [roundStatus, setRoundStatus] = useState("waiting");
  const [players, setPlayers] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    const gameRef = doc(db, "games", roomId);
    const unsubscribe = onSnapshot(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setPlayers(data.players || []);
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
        // Update roundStatus if stored; otherwise default to "waiting"
        setRoundStatus(data.roundStatus || "waiting");
      } else {
        Alert.alert("Game session not found!");
        router.replace("/lobby");
      }
    });
    return () => unsubscribe();
  }, [roomId]);

  // Host-only: Start Round button. The button is shown if the host is logged in and roundStatus is "waiting"
  const initializeRound = async () => {
    if (!isHost) return;
    if (players.length === 0) {
      Alert.alert("No players available to start the round.");
      return;
    }
    // End the game if currentRound is 11 or higher.
    if (currentRound >= 11) {
      const gameRef = doc(db, "games", roomId);
      await updateDoc(gameRef, { roundStatus: "gameOver" });
      setRoundStatus("gameOver");
      return;
    }
    const newDeck = shuffleArray(generateDeck());
    const hands = {};
    // Deal 9 cards to each player.
    players.forEach((player) => {
      hands[player.id] = newDeck.splice(0, 9);
    });
    const gameRef = doc(db, "games", roomId);
    await updateDoc(gameRef, {
      deck: newDeck,
      discardPile: [],
      hands: hands,
      currentRound: currentRound + 1,
      roundStatus: "started",
      currentTurn: players[0]?.id,
    });
    setRoundStatus("started");
  };

  const drawFromDeck = async () => {
    if (playerId !== currentTurn) {
      Alert.alert("Not your turn!");
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
    const gameRef = doc(db, "games", roomId);
    await updateDoc(gameRef, {
      deck: newDeck,
      [`hands.${playerId}`]: newHand,
    });
  };

  const drawFromDiscard = async () => {
    if (playerId !== currentTurn) {
      Alert.alert("Not your turn!");
      return;
    }
    if (discardPile.length === 0) {
      Alert.alert("The discard pile is empty!");
      return;
    }
    const drawnCard = discardPile[discardPile.length - 1];
    const newDiscardPile = discardPile.slice(0, -1);
    const newHand = [...playerHand, drawnCard];
    setPlayerHand(newHand);
    const gameRef = doc(db, "games", roomId);
    await updateDoc(gameRef, {
      discardPile: newDiscardPile,
      [`hands.${playerId}`]: newHand,
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Host Start Round Button: Visible if host and roundStatus is "waiting" */}
      {isHost && roundStatus === "waiting" && (
        <TouchableOpacity style={styles.startRoundButton} onPress={initializeRound}>
          <Text style={styles.startRoundText}>Start Round</Text>
        </TouchableOpacity>
      )}
      {/* Header: display "Game Over" if roundStatus is "gameOver", else display current round */}
      <Text style={[styles.header, { color: colors.text }]}>
        {roundStatus === "gameOver" ? "Game Over" : `Round ${currentRound}`}
      </Text>
      {/* Avatars Row */}
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
            <Text
              style={[
                styles.avatarName,
                player.id === currentTurn && styles.currentTurnAvatarName,
              ]}
            >
              {player.name}
            </Text>
          </View>
        ))}
      </View>
      {/* Deck and Discard Pile */}
      <View style={styles.deckDiscardContainer}>
        <TouchableOpacity onPress={drawFromDeck} style={styles.deckCard}>
          <Text style={styles.cardText}>Deck ({deck.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={drawFromDiscard} style={styles.deckCard}>
          {discardPile.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardText}>
                {discardPile[discardPile.length - 1].rank}{" "}
                {suitSymbols[discardPile[discardPile.length - 1].suit]}
              </Text>
            </View>
          ) : (
            <Text style={styles.cardText}>Empty Discard</Text>
          )}
        </TouchableOpacity>
      </View>
      {/* Player Hand */}
      <Text style={[styles.subHeader, { color: colors.text }]}>Your Hand:</Text>
      <ScrollView horizontal contentContainerStyle={styles.handContainer}>
        {playerHand.map((card, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.cardText}>
              {card.rank} {suitSymbols[card.suit]}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  startRoundButton: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 3,
    backgroundColor: "#c3c3c3",
    marginVertical: 10,
    borderWidth: 4,
    borderLeftColor: "#fff",
    borderTopColor: "#fff",
    borderRightColor: "#404040",
    borderBottomColor: "#404040",
  },
  startRoundText: {
    color: "#fff",
    fontFamily: "PressStart2P",
    fontSize: 14
  },
  header: {
    fontSize: 20,
    fontFamily: "PressStart2P",
    textAlign: "center",
    marginBottom: 20
  },
  subHeader: {
    fontSize: 16,
    fontFamily: "PressStart2P",
    textAlign: "center",
    marginVertical: 10
  },
  avatarRow: {
    flexDirection: "row", 
    justifyContent: "center",
    width: "100%", 
    marginBottom: 20
  },
  avatarContainer: {
    alignItems: "center",
    width: 100,
    padding: 5,
    backgroundColor: "#c3c3c3", 
    borderWidth: 4,
    borderLeftColor: "#fff",
    borderTopColor: "#fff",
    borderRightColor: "#404040",
    borderBottomColor: "#404040",
  },
  currentTurnHighlight: {
     
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderWidth: 4,
    borderTopColor: "#404040",
    borderLeftColor: "#404040",
    borderBottomColor: "#fff",
    borderRightColor: "#fff",
  },
  avatarName: {
    fontFamily: "PressStart2P",
    fontSize: 10,
    marginTop: 5,
    color: "#000"
  },
  currentTurnAvatarName: {
    color: "yellow",
  },
  deckDiscardContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    marginVertical: 20
  },
  deckCard: {
    width: 100,
    height: 140,
    backgroundColor: "#444",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    padding: 5
  },
  handContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    backgroundColor: "#c3c3c3",
    borderWidth: 4,
    borderLeftColor: "#fff",
    borderTopColor: "#fff",
    borderRightColor: "#404040",
    borderBottomColor: "#404040",
    padding: 10,
    marginVertical: 10,
    borderRadius: 3,
    height: "25%",
    width: "100%",
  },
  card: {
    height: "100%",
    aspectRatio: 0.7,
    backgroundColor: "#fff",
    borderColor: "#000",
    borderWidth: 1,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
    marginHorizontal: 5,
  },
  cardText: {
    fontFamily: "PressStart2P",
    fontSize: 12,
    textAlign: "center",
    color: "#000"
  },
});
