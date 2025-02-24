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
import * as SplashScreen from "expo-splash-screen";
import { DraxProvider, DraxList, DraxView } from "react-native-drax";
import { db } from "@/firebaseConfig";
import { doc, updateDoc, onSnapshot, arrayUnion } from "firebase/firestore";

SplashScreen.preventAutoHideAsync();

const SUITS = ["hearts", "diamonds", "clubs", "spades"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

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

function getCardValue(card) {
  if (card.rank === "A") return 11;
  if (card.rank === "J") return 12;
  if (card.rank === "Q") return 13;
  if (card.rank === "K") return 14;
  return parseInt(card.rank);
}

export default function GameScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { roomId, playerId } = useLocalSearchParams();

  const [deck, setDeck] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [gameStatus, setGameStatus] = useState("waiting");
  const [players, setPlayers] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [playersReady, setPlayersReady] = useState([]);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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

  useEffect(() => {
    if (currentTurn === playerId) {
      setHasDrawn(false);
    }
  }, [currentTurn, playerId]);

  const initializeRound = async () => {
    if (!isHost) return;
    if (players.length === 0) {
      Alert.alert("No players available to start the round.");
      return;
    }
    let newDeck = shuffleArray(generateDeck());
    const hands = {};
    players.forEach((player) => {
      hands[player.id] = newDeck.splice(0, 9);
    });
    let initialDiscard = [];
    if (players.length !== 4) {
      const firstDiscard = newDeck.shift();
      if (firstDiscard !== undefined) {
        initialDiscard.push(firstDiscard);
      }
    }
    const firstTurn = players[0]?.id;
    if (!firstTurn) {
      Alert.alert("Error: No valid player to set as first turn.");
      return;
    }
    const gameRef = doc(db, "games", roomId);
    await updateDoc(gameRef, {
      deck: newDeck,
      discardPile: initialDiscard,
      hands: hands,
      currentRound: currentRound + 1,
      status: "started",
      currentTurn: firstTurn,
      playersReady: [],
    });
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

  const drawFromDiscard = async () => {
    if (playerId !== currentTurn) {
      Alert.alert("Not your turn!");
      return;
    }
    if (hasDrawn) {
      Alert.alert("You have already drawn a card this turn!");
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
    setHasDrawn(true);
    const gameRef = doc(db, "games", roomId);
    await updateDoc(gameRef, {
      discardPile: newDiscardPile,
      [`hands.${playerId}`]: newHand,
    });
  };

  const discardCard = async (cardIndex) => {
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
      [`hands.${playerId}`]: newHand,
      currentTurn: nextTurn,
    });
    setHasDrawn(false);
  };

  const declareRump = async () => {
    Alert.alert("Rump declared!", "Ending your turn and scoring this round.");
    const gameRef = doc(db, "games", roomId);
    await updateDoc(gameRef, {
      status: "roundEnded",
      playersReady: [],
    });
  };

  const declareReadyForNextRound = async () => {
    const gameRef = doc(db, "games", roomId);
    await updateDoc(gameRef, {
      playersReady: arrayUnion(playerId),
    });
  };

  useEffect(() => {
    if (
      gameStatus === "roundEnded" &&
      playersReady.length === players.length &&
      isHost &&
      deck.length === 0
    ) {
      initializeRound();
    }
  }, [gameStatus, playersReady, players, isHost, deck]);

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
            <Image source={{ uri: player.avatar }} style={styles.avatarImage} />
            <Text style={styles.avatarName}>{player.name}</Text>
          </View>
        ))}
      </View>
      <View style={styles.deckDiscardContainer}>
        <TouchableOpacity onPress={drawFromDeck} style={styles.deckCard}>
          <Text style={styles.cardText}>Deck ({deck.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={drawFromDiscard} style={styles.deckCard}>
          {discardPile.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardText}>
                {discardPile[discardPile.length - 1].rank} of {discardPile[discardPile.length - 1].suit}
              </Text>
            </View>
          ) : (
            <Text style={styles.cardText}>Empty Discard</Text>
          )}
        </TouchableOpacity>
      </View>
      <Text style={[styles.subHeader, { color: colors.text }]}>Your Hand:</Text>
      <DraxProvider>
        <DraxList
          data={playerHand}
          horizontal
          onItemReorder={({ fromIndex, toIndex }) => {
            const newHand = [...playerHand];
            const [removed] = newHand.splice(fromIndex, 1);
            newHand.splice(toIndex, 0, removed);
            setPlayerHand(newHand);
            // Not updating Firebase here so that reordering is purely local.
          }}
          keyExtractor={(item, index) => index.toString()}
          renderItemContent={({ item, index }) => (
            <DraxView
              payload={{ index, item }}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setIsDragging(false)}
            >
              <TouchableOpacity
                onPress={() => {
                  // Only trigger discard if not dragging and it's your turn.
                  if (!isDragging && playerId === currentTurn) {
                    discardCard(index);
                  }
                }}
              >
                <View style={styles.card}>
                  <Text style={styles.cardText}>
                    {item.rank} of {item.suit}
                  </Text>
                </View>
              </TouchableOpacity>
            </DraxView>
          )}
        />
      </DraxProvider>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={declareRump}>
          <Text style={styles.actionText}>Rump!</Text>
        </TouchableOpacity>
      </View>
      {gameStatus === "roundEnded" && (
        <View style={styles.readyContainer}>
          {playersReady.includes(playerId) ? (
            <Text style={styles.readyText}>Waiting for others...</Text>
          ) : (
            <TouchableOpacity style={styles.hostButton} onPress={declareReadyForNextRound}>
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
  header: { fontSize: 20, fontFamily: "PressStart2P", textAlign: "center", marginBottom: 20 },
  subHeader: { fontSize: 16, fontFamily: "PressStart2P", textAlign: "center", marginVertical: 10 },
  avatarRow: { flexDirection: "row", justifyContent: "space-evenly", width: "100%", marginBottom: 20 },
  avatarContainer: { alignItems: "center", padding: 5, borderRadius: 5 },
  currentTurnHighlight: { borderWidth: 2, borderColor: "yellow" },
  avatarImage: { width: 40, height: 40, borderRadius: 20 },
  avatarName: { fontFamily: "PressStart2P", fontSize: 8, marginTop: 2, color: "#000" },
  deckDiscardContainer: { flexDirection: "row", justifyContent: "space-evenly", width: "100%", marginVertical: 20 },
  deckCard: { width: 100, height: 140, backgroundColor: "#444", borderRadius: 5, alignItems: "center", justifyContent: "center", padding: 5 },
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
    margin: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  cardText: { fontFamily: "PressStart2P", fontSize: 12, textAlign: "center", color: "#000" },
  actions: { flexDirection: "row", marginVertical: 10 },
  actionButton: { backgroundColor: "#000", padding: 10, margin: 5, borderRadius: 5 },
  actionText: { color: "#fff", fontFamily: "PressStart2P" },
  hostButton: { backgroundColor: "#000", padding: 10, marginVertical: 10, borderRadius: 5 },
  hostButtonText: { color: "#fff", fontFamily: "PressStart2P" },
  readyContainer: { marginVertical: 10, alignItems: "center" },
  readyText: { fontFamily: "PressStart2P", fontSize: 12, color: "#000" },
});
