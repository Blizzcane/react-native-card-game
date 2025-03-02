import React, { useEffect, useState, useMemo, useCallback } from "react";
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
import { db } from "@/firebaseConfig";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import avatars from "@/utils/avatarLoader";

SplashScreen.preventAutoHideAsync();

// Constants
const suitSymbols = { hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" };
const SUITS = ["hearts", "diamonds", "clubs", "spades"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const MAX_CARDS = 10;
const groupColors = [
  "#FF5733",
  "#33FF57",
  "#3357FF",
  "#FF33A8",
  "#A833FF",
  "#33FFF3",
];

/* --- Static Image Imports --- */
// Diamonds: images are named B1.png, B2.png, ..., B10.png, B12.png, B13.png, B14.png.
const diamondImages = {
  A: require("@/assets/images/card-images/B1.png"),
  "2": require("@/assets/images/card-images/B2.png"),
  "3": require("@/assets/images/card-images/B3.png"),
  "4": require("@/assets/images/card-images/B4.png"),
  "5": require("@/assets/images/card-images/B5.png"),
  "6": require("@/assets/images/card-images/B6.png"),
  "7": require("@/assets/images/card-images/B7.png"),
  "8": require("@/assets/images/card-images/B8.png"),
  "9": require("@/assets/images/card-images/B9.png"),
  "10": require("@/assets/images/card-images/B10.png"),
  J: require("@/assets/images/card-images/B12.png"),
  Q: require("@/assets/images/card-images/B13.png"),
  K: require("@/assets/images/card-images/B14.png"),
};

// Clubs (Clovers): images are named G1.png, G2.png, ..., G10.png, G12.png, G13.png, G14.png.
const clubImages = {
  A: require("@/assets/images/card-images/G1.png"),
  "2": require("@/assets/images/card-images/G2.png"),
  "3": require("@/assets/images/card-images/G3.png"),
  "4": require("@/assets/images/card-images/G4.png"),
  "5": require("@/assets/images/card-images/G5.png"),
  "6": require("@/assets/images/card-images/G6.png"),
  "7": require("@/assets/images/card-images/G7.png"),
  "8": require("@/assets/images/card-images/G8.png"),
  "9": require("@/assets/images/card-images/G9.png"),
  "10": require("@/assets/images/card-images/G10.png"),
  J: require("@/assets/images/card-images/G12.png"),
  Q: require("@/assets/images/card-images/G13.png"),
  K: require("@/assets/images/card-images/G14.png"),
};

// Hearts: images are named H1.png, H2.png, ..., H10.png, H12.png, H13.png, H14.png.
const heartImages = {
  A: require("@/assets/images/card-images/H1.png"),
  "2": require("@/assets/images/card-images/H2.png"),
  "3": require("@/assets/images/card-images/H3.png"),
  "4": require("@/assets/images/card-images/H4.png"),
  "5": require("@/assets/images/card-images/H5.png"),
  "6": require("@/assets/images/card-images/H6.png"),
  "7": require("@/assets/images/card-images/H7.png"),
  "8": require("@/assets/images/card-images/H8.png"),
  "9": require("@/assets/images/card-images/H9.png"),
  "10": require("@/assets/images/card-images/H10.png"),
  J: require("@/assets/images/card-images/H12.png"),
  Q: require("@/assets/images/card-images/H13.png"),
  K: require("@/assets/images/card-images/H14.png"),
};

// Spades: images are named L1.png, L2.png, ..., L10.png, L12.png, L13.png, L14.png.
const spadeImages = {
  A: require("@/assets/images/card-images/L1.png"),
  "2": require("@/assets/images/card-images/L2.png"),
  "3": require("@/assets/images/card-images/L3.png"),
  "4": require("@/assets/images/card-images/L4.png"),
  "5": require("@/assets/images/card-images/L5.png"),
  "6": require("@/assets/images/card-images/L6.png"),
  "7": require("@/assets/images/card-images/L7.png"),
  "8": require("@/assets/images/card-images/L8.png"),
  "9": require("@/assets/images/card-images/L9.png"),
  "10": require("@/assets/images/card-images/L10.png"),
  J: require("@/assets/images/card-images/L12.png"),
  Q: require("@/assets/images/card-images/L13.png"),
  K: require("@/assets/images/card-images/L14.png"),
};

const cardImages = {
  diamonds: diamondImages,
  clubs: clubImages,
  hearts: heartImages,
  spades: spadeImages,
};

// Helper function to get the image for a card.
function getCardImage(card) {
  return cardImages[card.suit][card.rank];
}

/* --- Other Helper Functions --- */

// For grouping runs, an Ace can be 1 or 11.
function getCardValues(card) {
  if (card.rank === "A") return [1, 11];
  if (card.rank === "J") return [12];
  if (card.rank === "Q") return [13];
  if (card.rank === "K") return [14];
  return [parseInt(card.rank, 10)];
}

// For leftover scoring, an Ace always counts as 1.
function getCardScore(card) {
  if (card.rank === "A") return 1;
  if (card.rank === "J") return 12;
  if (card.rank === "Q") return 13;
  if (card.rank === "K") return 14;
  return parseInt(card.rank, 10);
}

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

// Returns true if card2 is consecutive to card1 (same suit; Ace can be 1 or 11).
function isConsecutive(card1, card2) {
  if (card1.suit !== card2.suit) return false;
  const vals1 = getCardValues(card1);
  const vals2 = getCardValues(card2);
  for (const v1 of vals1) {
    for (const v2 of vals2) {
      if (v2 - v1 === 1) return true;
    }
  }
  return false;
}

// Determines if the cards form a valid group (set or run).
function isValidGroup(cards) {
  if (cards.length < 3) return false;
  const rank = cards[0].rank;
  if (cards.every((c) => c.rank === rank)) return true;
  const suit = cards[0].suit;
  if (!cards.every((c) => c.suit === suit)) return false;
  for (let i = 0; i < cards.length - 1; i++) {
    if (!isConsecutive(cards[i], cards[i + 1])) return false;
  }
  return true;
}

// computeGroups: returns an array of group objects (with indices) based on the current hand arrangement.
function computeGroups(hand) {
  const groups = [];
  let i = 0;
  // Find sets.
  while (i < hand.length) {
    let j = i + 1;
    while (j < hand.length && hand[j].rank === hand[i].rank) {
      j++;
    }
    if (j - i >= 3) {
      groups.push({
        indices: Array.from({ length: j - i }, (_, k) => i + k),
        type: "set",
      });
    }
    i = j;
  }
  // Find runs.
  i = 0;
  while (i < hand.length) {
    const groupIndices = [i];
    while (i < hand.length - 1 && isConsecutive(hand[i], hand[i + 1])) {
      groupIndices.push(i + 1);
      i++;
    }
    if (groupIndices.length >= 3) {
      groups.push({ indices: groupIndices, type: "run" });
    }
    i++;
  }
  return groups;
}

/* --- New Scoring Functions --- */

// Computes the score from the player's arranged hand.
// Cards that are part of a valid group score 0; ungrouped cards sum up via getCardScore.
function computeScoreFromArrangement(hand) {
  const groups = computeGroups(hand);
  const groupedIndices = new Set();
  groups.forEach((group) => {
    group.indices.forEach((index) => groupedIndices.add(index));
  });
  return hand.reduce((total, card, index) => {
    return total + (groupedIndices.has(index) ? 0 : getCardScore(card));
  }, 0);
}

// Use the new scoring method for the round.
function computeRoundScore(hand) {
  return computeScoreFromArrangement(hand);
}

// Rump mode validation: check if discarding one card makes the arranged score 0.
function isValidRumpUsingComputedGroups(hand) {
  if (hand.length !== 10) return false;
  for (let i = 0; i < hand.length; i++) {
    const candidateHand = hand.filter((_, idx) => idx !== i);
    if (computeScoreFromArrangement(candidateHand) === 0) {
      return true;
    }
  }
  return false;
}

/* --- GameScreen Component --- */

export default function GameScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { roomId, playerId } = useLocalSearchParams();

  // Fixed sizes.
  const cardSize = { width: 80, height: 110 };
  const avatarContainerSize = { width: 100 };

  const [deck, setDeck] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [displayHand, setDisplayHand] = useState([]);
  const [allHands, setAllHands] = useState({});
  const [currentRound, setCurrentRound] = useState(1);
  const [roundStatus, setRoundStatus] = useState("waiting");
  const [players, setPlayers] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [hasDrawnCard, setHasDrawnCard] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [discardMode, setDiscardMode] = useState(false);
  const [rumpMode, setRumpMode] = useState(false);
  const [scoresUpdated, setScoresUpdated] = useState(false);

  // Dealer and turn tracking.
  const [dealerIndex, setDealerIndex] = useState(0);
  const [startingPlayerIndex, setStartingPlayerIndex] = useState(0);

  const isRoundActive = roundStatus === "started";

  useEffect(() => {
    if (!roomId) return;
    const gameRef = doc(db, "games", roomId);
    const unsubscribe = onSnapshot(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setPlayers(data.players || []);
        setCurrentRound(data.currentRound || 0);
        if (data.deck) setDeck(data.deck);
        if (data.discardPile) setDiscardPile(data.discardPile);
        if (data.hands) {
          setAllHands(data.hands);
          if (data.hands[playerId]) {
            const newHand = data.hands[playerId];
            setPlayerHand(newHand);
            setDisplayHand(newHand);
          }
        }
        if (data.hostId === playerId) {
          setIsHost(true);
        }
        if (data.currentTurn) {
          setCurrentTurn(data.currentTurn);
          if (data.currentTurn !== currentTurn) {
            setHasDrawnCard(false);
          }
        }
        if (typeof data.dealerIndex === "number") setDealerIndex(data.dealerIndex);
        if (typeof data.startingPlayerIndex === "number") setStartingPlayerIndex(data.startingPlayerIndex);
        setRoundStatus(data.roundStatus || "waiting");
      } else {
        Alert.alert("Game session not found!");
        router.replace("/lobby");
      }
    });
    return () => unsubscribe();
  }, [roomId, currentTurn, playerId, router]);

  // When a round ends and if host, update scores once.
  useEffect(() => {
    if (roundStatus === "waiting" && isHost && !scoresUpdated) {
      setScoresUpdated(true);
      console.log("Round ended. Logging each player's hand:");
      players.forEach((player) => {
        const hand = allHands[player.id] || [];
        console.log(`Player ${player.name}'s hand:`);
        hand.forEach((card, idx) => {
          console.log(`  Card ${idx}: ${card.rank} ${suitSymbols[card.suit]}, Value: ${getCardScore(card)}`);
        });
      });
      const updatedPlayers = players.map((player) => {
        const hand = allHands[player.id] || [];
        const roundScore = computeRoundScore(hand);
        const prevScore = player.score || 0;
        console.log(`Updating ${player.name}: prevScore: ${prevScore}, roundScore: ${roundScore}`);
        return { ...player, score: prevScore + roundScore };
      });
      updateDoc(doc(db, "games", roomId), { players: updatedPlayers })
        .catch((err) => console.error("Failed to update scores", err));
    }
  }, [roundStatus, isHost, scoresUpdated, players, allHands, roomId]);

  const initializeRound = async () => {
    if (!isHost) return;
    if (players.length === 0) {
      Alert.alert("No players available to start the round.");
      return;
    }
    if (currentRound >= 11) {
      await updateDoc(doc(db, "games", roomId), { roundStatus: "gameOver" });
      setRoundStatus("gameOver");
      return;
    }
    const currentDealerIndex = dealerIndex;
    const newDealerIndex = (currentDealerIndex + 1) % players.length;
    const newStartingIndex = (newDealerIndex + 1) % players.length;
    const newDeck = shuffleArray(generateDeck());
    const hands = {};
    players.forEach((player) => {
      hands[player.id] = newDeck.splice(0, 9);
    });
    // If there are less than 4 players, move the top card from the deck to the discard pile.
    let newDiscardPile = [];
    if (players.length < 4) {
      const topCard = newDeck.shift();
      newDiscardPile.push(topCard);
    }
    await updateDoc(doc(db, "games", roomId), {
      deck: newDeck,
      discardPile: newDiscardPile,
      hands,
      currentRound: currentRound + 1,
      roundStatus: "started",
      dealerIndex: newDealerIndex,
      startingPlayerIndex: newStartingIndex,
      currentTurn: players[newStartingIndex]?.id,
    });
    const myHand = hands[playerId] || [];
    setPlayerHand(myHand);
    setDisplayHand(myHand);
    setRoundStatus("started");
    setHasDrawnCard(false);
    setScoresUpdated(false);
    setDealerIndex(newDealerIndex);
    setStartingPlayerIndex(newStartingIndex);
  };

  const drawCard = async (sourceKey) => {
    if (!isRoundActive) return;
    const source = sourceKey === "deck" ? deck : discardPile;
    if (playerId !== currentTurn) {
      Alert.alert("Not your turn!");
      return;
    }
    if (hasDrawnCard) {
      Alert.alert("You've already drawn a card this turn!");
      return;
    }
    if (source.length === 0) {
      Alert.alert(sourceKey === "deck" ? "The deck is empty!" : "The discard pile is empty!");
      return;
    }
    if (playerHand.length >= MAX_CARDS) {
      Alert.alert(`You can only have ${MAX_CARDS} cards in your hand. Please discard first.`);
      return;
    }
    const drawnCard = sourceKey === "deck" ? source[0] : source[source.length - 1];
    const newSource = sourceKey === "deck" ? source.slice(1) : source.slice(0, -1);
    const newHand = [...playerHand, drawnCard];
    setPlayerHand(newHand);
    setDisplayHand(newHand);
    await updateDoc(doc(db, "games", roomId), {
      [sourceKey]: newSource,
      [`hands.${playerId}`]: newHand,
    });
    setHasDrawnCard(true);
  };

  const drawFromDeck = useCallback(() => drawCard("deck"), [deck, playerHand, hasDrawnCard, currentTurn, roundStatus]);
  const drawFromDiscard = useCallback(() => drawCard("discardPile"), [discardPile, playerHand, hasDrawnCard, currentTurn, roundStatus]);

  const discardCard = async (index) => {
    if (!isRoundActive) return;
    if (playerId !== currentTurn) {
      Alert.alert("Not your turn!");
      return;
    }
    const cardToDiscard = displayHand[index];
    const cardIndex = playerHand.findIndex(
      (card) => card.rank === cardToDiscard.rank && card.suit === cardToDiscard.suit
    );
    if (cardIndex === -1) {
      Alert.alert("Error: Card not found");
      return;
    }
    const newHand = [...playerHand];
    const discardedCard = newHand.splice(cardIndex, 1)[0];
    const newDisplayHand = [...displayHand];
    newDisplayHand.splice(index, 1);
    setDisplayHand(newDisplayHand);
    const currentPlayerIndex = players.findIndex((player) => player.id === playerId);
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    const nextPlayerId = players[nextPlayerIndex]?.id;
    await updateDoc(doc(db, "games", roomId), {
      [`hands.${playerId}`]: newHand,
      discardPile: [...discardPile, discardedCard],
      currentTurn: nextPlayerId,
    });
    setHasDrawnCard(false);
  };

  const validRumpAvailable = useMemo(() => isValidRumpUsingComputedGroups(displayHand), [displayHand]);

  const handleCardPress = useCallback(
    (index) => {
      if (!isRoundActive) return;
      if (rumpMode) {
        const candidateCard = displayHand[index];
        const newHand = displayHand.filter((_, i) => i !== index);
        if (computeScoreFromArrangement(newHand) === 0) {
          const currentPlayerIndex = players.findIndex((player) => player.id === playerId);
          const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
          const nextPlayerId = players[nextPlayerIndex]?.id;
          updateDoc(doc(db, "games", roomId), {
            [`hands.${playerId}`]: newHand,
            discardPile: [...discardPile, candidateCard],
            roundStatus: "waiting",
            currentTurn: nextPlayerId,
          }).catch((err) => console.error("Failed to update rump discard", err));
          setRumpMode(false);
        } else {
          Alert.alert("Discarding this card would invalidate your rump!");
        }
        return;
      }
      if (discardMode) {
        discardCard(index);
        setDiscardMode(false);
      } else {
        if (selectedCardIndex === index) {
          setSelectedCardIndex(null);
        } else if (selectedCardIndex !== null) {
          const newDisplayHand = [...displayHand];
          const [card] = newDisplayHand.splice(selectedCardIndex, 1);
          newDisplayHand.splice(index, 0, card);
          setDisplayHand(newDisplayHand);
          setPlayerHand(newDisplayHand);
          updateDoc(doc(db, "games", roomId), {
            [`hands.${playerId}`]: newDisplayHand,
          }).catch((err) => console.error("Failed to update hand order", err));
          setSelectedCardIndex(null);
        } else {
          setSelectedCardIndex(index);
        }
      }
    },
    [rumpMode, displayHand, discardMode, selectedCardIndex, roomId, playerId, players, discardPile, roundStatus]
  );

  const canToggleDiscard = isRoundActive && playerId === currentTurn && hasDrawnCard && !rumpMode;
  const canToggleRump = isRoundActive && playerId === currentTurn && hasDrawnCard && !discardMode;

  const rumpButtonStyle = useMemo(() => {
    if (!rumpMode) return { backgroundColor: "#ccc" };
    return validRumpAvailable
      ? { backgroundColor: "#0f0", borderWidth: 3, borderColor: "gold" }
      : { backgroundColor: "#a00" };
  }, [rumpMode, validRumpAvailable]);

  const highlightMapping = useMemo(() => {
    const mapping = {};
    const groups = computeGroups(displayHand);
    groups.forEach((group, i) => {
      group.indices.forEach((index) => {
        mapping[index] = groupColors[i % groupColors.length];
      });
    });
    return mapping;
  }, [displayHand]);

  const winner = useMemo(() => {
    if (roundStatus !== "gameOver") return null;
    const sorted = [...players].sort((a, b) => (a.score || 0) - (b.score || 0));
    return sorted[0];
  }, [roundStatus, players]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {isHost && roundStatus === "waiting" && (
          <TouchableOpacity style={styles.startRoundButton} onPress={initializeRound}>
            <Text style={styles.startRoundText}>Start Round</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.header, { color: colors.text }]}>
          {roundStatus === "gameOver" ? "Game Over" : `Round ${currentRound}`}
        </Text>
        {roundStatus === "gameOver" && winner && (
          <Text style={[styles.winnerText, { color: colors.text }]}>
            Winner: {winner.name} with {String(winner.score || 0).padStart(3, "0")}
          </Text>
        )}
        <View style={[styles.avatarRow, avatarContainerSize]}>
          {players.map((player) => (
            <View
              key={player.id}
              style={[
                styles.avatarContainer,
                avatarContainerSize,
                player.id === currentTurn && styles.currentTurnHighlight,
              ]}
            >
              <Text
                style={[
                  styles.avatarName,
                  player.id === currentTurn && styles.currentTurnAvatarName,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {player.name}
              </Text>
              <Image source={avatars[player.avatar]} style={styles.avatarImage} />
              <View style={styles.scoreBorder}>
                <Text style={styles.scoreText} numberOfLines={1} adjustsFontSizeToFit>
                  {String(player.score || 0).padStart(3, "0")}
                </Text>
              </View>
            </View>
          ))}
        </View>
        <View style={styles.deckDiscardContainer}>
          <View style={styles.deckColumn}>
            <TouchableOpacity
              onPress={drawFromDeck}
              style={[
                styles.deckCard,
                (!isRoundActive || hasDrawnCard || playerHand.length >= MAX_CARDS) && styles.disabledDeck,
              ]}
              disabled={!isRoundActive || hasDrawnCard || playerHand.length >= MAX_CARDS}
            >
              <Text style={styles.cardText}>Deck ({deck.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.rumpButton,
                !canToggleRump && styles.disabledButton,
                rumpButtonStyle,
              ]}
              onPress={() => {
                if (!canToggleRump) {
                  Alert.alert("You cannot toggle Rump mode right now!");
                  return;
                }
                setRumpMode(!rumpMode);
                if (rumpMode === true) setDiscardMode(false);
              }}
              disabled={!canToggleRump}
            >
              <Text
                style={[
                  styles.rumpButtonText,
                  !canToggleRump && styles.disabledButton,
                  rumpMode ? { color: "#fff" } : { color: "#000" },
                ]}
              >
                Rump
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.discardColumn}>
            <TouchableOpacity
              onPress={drawFromDiscard}
              style={[
                styles.deckCard,
                (!isRoundActive || hasDrawnCard || discardPile.length === 0 || playerHand.length >= MAX_CARDS) && styles.disabledDeck,
              ]}
              disabled={!isRoundActive || hasDrawnCard || discardPile.length === 0 || playerHand.length >= MAX_CARDS}
            >
              {discardPile.length > 0 ? (
                <Image source={getCardImage(discardPile[discardPile.length - 1])} style={styles.cardImage} />
              ) : (
                <Text style={styles.cardText}>Empty Discard</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.discardButton,
                !canToggleDiscard && styles.disabledButton,
                discardMode ? { backgroundColor: "#a00" } : { backgroundColor: "#ccc" },
              ]}
              onPress={() => {
                if (!canToggleDiscard) {
                  Alert.alert("You cannot toggle Discard mode right now!");
                  return;
                }
                setDiscardMode(!discardMode);
                if (!discardMode) setRumpMode(false);
              }}
              disabled={!canToggleDiscard}
            >
              <Text
                style={[
                  styles.discardButtonText,
                  !canToggleDiscard && styles.disabledButton,
                  discardMode ? { color: "#fff" } : { color: "#000" },
                ]}
              >
                Discard
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.handContainer}>
          {displayHand.map((card, index) => {
            const comboStyle = highlightMapping[index]
              ? { borderColor: highlightMapping[index], borderWidth: 3 }
              : null;
            return (
              <TouchableOpacity
                key={`${card.rank}-${card.suit}-${index}`}
                style={[
                  styles.card,
                  cardSize,
                  selectedCardIndex === index && styles.selectedCard,
                  comboStyle,
                ]}
                onPress={() => handleCardPress(index)}
              >
                <Image source={getCardImage(card)} style={styles.cardImage} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  content: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingVertical: 20,
  },
  startRoundButton: {
    padding: 10,
    borderRadius: 3,
    backgroundColor: "#c3c3c3",
    alignSelf: "center",
    borderWidth: 4,
    borderLeftColor: "#fff",
    borderTopColor: "#fff",
    borderRightColor: "#404040",
    borderBottomColor: "#404040",
    marginBottom: 10,
  },
  startRoundText: { color: "#fff", fontFamily: "PressStart2P", fontSize: 14 },
  header: {
    fontSize: 20,
    fontFamily: "PressStart2P",
    textAlign: "center",
    marginBottom: 10,
  },
  winnerText: { fontFamily: "PressStart2P", fontSize: 16, marginBottom: 10 },
  avatarRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  avatarContainer: {
    alignItems: "center",
    padding: 5,
    backgroundColor: "#c3c3c3",
    borderWidth: 4,
    borderLeftColor: "#fff",
    borderTopColor: "#fff",
    borderRightColor: "#404040",
    borderBottomColor: "#404040",
    marginHorizontal: 5,
  },
  currentTurnHighlight: { backgroundColor: "#9e9572" },
  avatarName: {
    fontFamily: "PressStart2P",
    fontSize: 10,
    color: "#000",
    flexShrink: 1,
    minHeight: 15,
    textAlign: "center",
  },
  currentTurnAvatarName: { color: "yellow" },
  avatarImage: {
    width: 80,
    height: 80,
    borderWidth: 4,
    borderLeftColor: "#404040",
    borderTopColor: "#404040",
    borderRightColor: "#fff",
    borderBottomColor: "#fff",
  },
  scoreText: {
    fontFamily: "PressStart2P",
    fontSize: 10,
    color: "white",
    textAlign: "center",
  },
  scoreBorder: { 
    borderWidth: 3,
    backgroundColor: "black",
    borderLeftColor: "#404040",
    borderTopColor: "#404040",
    borderRightColor: "#fff",
    borderBottomColor: "#fff",
    paddingHorizontal: 3,
    paddingVertical: 2,
    marginTop: 5,
    alignSelf: "center",
  },
  deckDiscardContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginVertical: 10,
  },
  deckColumn: { alignItems: "center" },
  deckCard: {
    width: 80,
    height: 110,
    backgroundColor: "#444",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
  },
  disabledDeck: { backgroundColor: "#777", opacity: 0.6 },
  discardColumn: { alignItems: "center" },
  discardButton: {
    padding: 10,
    marginTop: 10,
    borderRadius: 3,
    borderWidth: 4,
    borderLeftColor: "#fff",
    borderTopColor: "#fff",
    borderRightColor: "#404040",
    borderBottomColor: "#404040",
  },
  discardButtonText: {
    color: "#000",
    fontFamily: "PressStart2P",
    fontSize: 12,
  },
  disabledButton: { opacity: 0.5 },
  rumpButton: {
    padding: 10,
    marginTop: 10,
    borderRadius: 3,
    borderWidth: 4,
    borderLeftColor: "#fff",
    borderTopColor: "#fff",
    borderRightColor: "#404040",
    borderBottomColor: "#404040",
  },
  rumpButtonText: {
    color: "#000",
    fontFamily: "PressStart2P",
    fontSize: 12,
    textAlign: "center",
  },
  handContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#c3c3c3",
    borderWidth: 4,
    borderLeftColor: "#fff",
    borderTopColor: "#fff",
    borderRightColor: "#404040",
    borderBottomColor: "#404040",
    borderRadius: 3,
  },
  card: {
    backgroundColor: "#fff",
    borderColor: "#000",
    borderWidth: 1,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
    margin: 5,
  },
  selectedCard: {
    backgroundColor: "#ffffd0",
    borderColor: "#ff8800",
    borderWidth: 2,
  },
  cardText: { fontFamily: "PressStart2P", fontSize: 12, textAlign: "center" },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
});
