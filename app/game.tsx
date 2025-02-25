import React, { useEffect, useState, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  Dimensions,
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

const MAX_CARDS = 10;

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
  const [displayHand, setDisplayHand] = useState([]); // Local state for display order
  const [currentRound, setCurrentRound] = useState(1);
  const [roundStatus, setRoundStatus] = useState("waiting");
  const [players, setPlayers] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [hasDrawnCard, setHasDrawnCard] = useState(false); // Track if player has drawn a card
  const [selectedCardIndex, setSelectedCardIndex] = useState(null); // For card movement
  const scrollViewRef = useRef(null);
  
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
          const newHand = data.hands[playerId];
          setPlayerHand(newHand);
          // Only update displayHand if this is the first load or cards were added/removed
          if (!displayHand.length || displayHand.length !== newHand.length) {
            setDisplayHand(newHand);
          }
        }
        if (data.hostId === playerId) {
          setIsHost(true);
        }
        if (data.currentTurn) {
          setCurrentTurn(data.currentTurn);
          // Reset hasDrawnCard when it's a new player's turn
          if (data.currentTurn !== currentTurn) {
            setHasDrawnCard(false);
          }
        }
        setRoundStatus(data.roundStatus || "waiting");
      } else {
        Alert.alert("Game session not found!");
        router.replace("/lobby");
      }
    });
    return () => unsubscribe();
  }, [roomId, currentTurn]);

  const initializeRound = async () => {
    if (!isHost) return;
    if (players.length === 0) {
      Alert.alert("No players available to start the round.");
      return;
    }
    if (currentRound >= 11) {
      const gameRef = doc(db, "games", roomId);
      await updateDoc(gameRef, { roundStatus: "gameOver" });
      setRoundStatus("gameOver");
      return;
    }
    
    const newDeck = shuffleArray(generateDeck());
    const hands = {};
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
    setHasDrawnCard(false);
  };

  const drawFromDeck = async () => {
    if (playerId !== currentTurn) {
      Alert.alert("Not your turn!");
      return;
    }
    if (hasDrawnCard) {
      Alert.alert("You've already drawn a card this turn!");
      return;
    }
    if (deck.length === 0) {
      Alert.alert("The deck is empty!");
      return;
    }
    if (playerHand.length >= MAX_CARDS) {
      Alert.alert(`You can only have ${MAX_CARDS} cards in your hand. Please discard first.`);
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
    setHasDrawnCard(true);
  };

  const drawFromDiscard = async () => {
    if (playerId !== currentTurn) {
      Alert.alert("Not your turn!");
      return;
    }
    if (hasDrawnCard) {
      Alert.alert("You've already drawn a card this turn!");
      return;
    }
    if (discardPile.length === 0) {
      Alert.alert("The discard pile is empty!");
      return;
    }
    if (playerHand.length >= MAX_CARDS) {
      Alert.alert(`You can only have ${MAX_CARDS} cards in your hand. Please discard first.`);
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
    setHasDrawnCard(true);
  };

  const discardCard = async (index) => {
    if (playerId !== currentTurn) {
      Alert.alert("Not your turn!");
      return;
    }
    
    // Get the card from the display order
    const cardToDiscard = displayHand[index];
    
    // Find the card in the actual hand array (matching by rank and suit)
    const cardIndex = playerHand.findIndex(
      card => card.rank === cardToDiscard.rank && card.suit === cardToDiscard.suit
    );
    
    if (cardIndex === -1) {
      Alert.alert("Error: Card not found");
      return;
    }
    
    // Remove card from database hand
    const newHand = [...playerHand];
    const discardedCard = newHand.splice(cardIndex, 1)[0];
    
    // Also remove from display hand
    const newDisplayHand = [...displayHand];
    newDisplayHand.splice(index, 1);
    setDisplayHand(newDisplayHand);
    
    // Find the next player's turn
    const currentPlayerIndex = players.findIndex(player => player.id === playerId);
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    const nextPlayerId = players[nextPlayerIndex]?.id;
    
    const gameRef = doc(db, "games", roomId);
    await updateDoc(gameRef, {
      [`hands.${playerId}`]: newHand,
      discardPile: [...discardPile, discardedCard],
      currentTurn: nextPlayerId,
    });
    setHasDrawnCard(false); // Reset for next turn
  };

  // Function to handle card selection for moving
  const selectCard = (index) => {
    if (selectedCardIndex === index) {
      // Deselect if tapping the same card
      setSelectedCardIndex(null);
    } else if (selectedCardIndex !== null) {
      // If a card was already selected, move it to the new position
      const newDisplayHand = [...displayHand];
      const [card] = newDisplayHand.splice(selectedCardIndex, 1);
      newDisplayHand.splice(index, 0, card);
      setDisplayHand(newDisplayHand);
      setSelectedCardIndex(null);
    } else {
      // Select the card for moving
      setSelectedCardIndex(index);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {isHost && roundStatus === "waiting" && (
        <TouchableOpacity style={styles.startRoundButton} onPress={initializeRound}>
          <Text style={styles.startRoundText}>Start Round</Text>
        </TouchableOpacity>
      )}
      
      <Text style={[styles.header, { color: colors.text }]}>
        {roundStatus === "gameOver" ? "Game Over" : `Round ${currentRound}`}
      </Text>
      
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
      
      <View style={styles.deckDiscardContainer}>
        <TouchableOpacity 
          onPress={drawFromDeck} 
          style={[
            styles.deckCard,
            (hasDrawnCard || playerHand.length >= MAX_CARDS) && styles.disabledDeck
          ]}
          disabled={hasDrawnCard || playerHand.length >= MAX_CARDS}
        >
          <Text style={styles.cardText}>Deck ({deck.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={drawFromDiscard}
          style={[
            styles.deckCard,
            (hasDrawnCard || discardPile.length === 0 || playerHand.length >= MAX_CARDS) && styles.disabledDeck
          ]}
          disabled={hasDrawnCard || discardPile.length === 0 || playerHand.length >= MAX_CARDS}
        >
          {discardPile.length > 0 ? (
            <View style={styles.card}>
              <Text style={[
                styles.cardText,
                { color: ["hearts", "diamonds"].includes(discardPile[discardPile.length - 1].suit) ? "red" : "black" }
              ]}>
                {discardPile[discardPile.length - 1].rank}{" "}
                {suitSymbols[discardPile[discardPile.length - 1].suit]}
              </Text>
            </View>
          ) : (
            <Text style={styles.cardText}>Empty Discard</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <Text style={[styles.subHeader, { color: colors.text }]}>
        Your Hand: {playerHand.length}/{MAX_CARDS}
      </Text>
      <Text style={styles.instructions}>
        Tap a card to {selectedCardIndex !== null ? 'place it' : 'select it'}.
        {playerId === currentTurn ? ' Double tap to discard.' : ''}
      </Text>
      
      <ScrollView 
        ref={scrollViewRef}
        horizontal
        contentContainerStyle={styles.handContainer}
        showsHorizontalScrollIndicator={true}
      >
        {displayHand.map((card, index) => (
          <TouchableOpacity
            key={`${card.rank}-${card.suit}-${index}`}
            style={[
              styles.card,
              selectedCardIndex === index && styles.selectedCard
            ]}
            onPress={() => selectCard(index)}
            onLongPress={() => {
              if (currentTurn === playerId) {
                Alert.alert(
                  "Discard Card",
                  `Discard ${card.rank} of ${card.suit}?`,
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Discard", onPress: () => discardCard(index) }
                  ]
                );
              }
            }}
          >
            <Text 
              style={[
                styles.cardText,
                { color: ["hearts", "diamonds"].includes(card.suit) ? "red" : "black" }
              ]}
            >
              {card.rank} {suitSymbols[card.suit]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {playerId === currentTurn ? 
            (hasDrawnCard ? "Choose a card to discard" : "Draw a card") : 
            "Waiting for other player"}
        </Text>
      </View>
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
  instructions: {
    fontSize: 12,
    fontFamily: "PressStart2P",
    textAlign: "center",
    color: "#666",
    marginBottom: 10
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
    backgroundColor: "#e3e3a3"
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
    color: "#800",
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
  disabledDeck: {
    backgroundColor: "#777",
    opacity: 0.6
  },
  handContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    backgroundColor: "#c3c3c3",
    borderWidth: 4,
    borderLeftColor: "#fff",
    borderTopColor: "#fff",
    borderRightColor: "#404040",
    borderBottomColor: "#404040",
    padding: 10,
    marginVertical: 10,
    borderRadius: 3,
    minHeight: 160,
    minWidth: "100%"
  },
  card: {
    height: 140,
    width: 100,
    backgroundColor: "#fff",
    borderColor: "#000",
    borderWidth: 1,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
    marginHorizontal: 5,
  },
  selectedCard: {
    backgroundColor: "#ffffd0",
    borderColor: "#ff8800",
    borderWidth: 2,
  },
  cardText: {
    fontFamily: "PressStart2P",
    fontSize: 12,
    textAlign: "center",
    color: "#000"
  },
  statusBar: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#c3c3c3",
    borderWidth: 4,
    borderLeftColor: "#404040",
    borderTopColor: "#404040",
    borderRightColor: "#fff",
    borderBottomColor: "#fff",
    width: "100%",
    alignItems: "center"
  },
  statusText: {
    fontFamily: "PressStart2P",
    fontSize: 10,
    color: "#000"
  }
});