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

const suitSymbols = { hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" };
const SUITS = ["hearts", "diamonds", "clubs", "spades"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const MAX_CARDS = 10;
const groupColors = ["#FF5733", "#33FF57", "#3357FF", "#FF33A8", "#A833FF", "#33FFF3"];

// Helper functions for deck and cards

function getCardValues(card) {
  if (card.rank === "A") return [1, 11];
  if (card.rank === "J") return [12];
  if (card.rank === "Q") return [13];
  if (card.rank === "K") return [14];
  return [parseInt(card.rank)];
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

// computeGroups returns candidate groups (sets or runs) with a minimum of 3 cards.
function computeGroups(hand) {
  const groups = [];
  let i = 0;
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

// Checks if a 10-card hand can become a valid rump by discarding one card.
// A valid rump is one where the remaining 9 cards can be completely grouped.
function isValidRumpUsingComputedGroups(hand) {
  if (hand.length !== 10) return false;
  for (let i = 0; i < hand.length; i++) {
    const candidateHand = hand.filter((_, idx) => idx !== i);
    const groups = computeGroups(candidateHand);
    const covered = new Array(candidateHand.length).fill(false);
    groups.forEach((group) => {
      group.indices.forEach((idx) => {
        covered[idx] = true;
      });
    });
    if (covered.every((v) => v === true)) {
      return true;
    }
  }
  return false;
}

export default function GameScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { roomId, playerId } = useLocalSearchParams();

  // Fixed sizes for cards and avatars.
  const cardSize = { width: 80, height: 110 };
  const avatarContainerSize = { width: 100, height: 120 };

  const [deck, setDeck] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [displayHand, setDisplayHand] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [roundStatus, setRoundStatus] = useState("waiting");
  const [players, setPlayers] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [hasDrawnCard, setHasDrawnCard] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [discardMode, setDiscardMode] = useState(false);
  const [rumpMode, setRumpMode] = useState(false);
  
  // New state to track dealer and starting turn.
  const [dealerIndex, setDealerIndex] = useState(0);
  const [startingPlayerIndex, setStartingPlayerIndex] = useState(0);

  // A round is active only when its status is "started"
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
        if (data.hands && data.hands[playerId]) {
          const newHand = data.hands[playerId];
          setPlayerHand(newHand);
          // Immediately update displayHand when hand changes.
          setDisplayHand(newHand);
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
        // Update dealer and starting player if available.
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
    // Rotate dealer: newDealerIndex is previous dealerIndex + 1 (mod players.length)
    const currentDealerIndex = dealerIndex;
    const newDealerIndex = (currentDealerIndex + 1) % players.length;
    // For many card games, the player after the dealer goes first.
    const newStartingIndex = (newDealerIndex + 1) % players.length;

    const newDeck = shuffleArray(generateDeck());
    const hands = {};
    // Deal 9 cards to each player.
    players.forEach((player) => {
      hands[player.id] = newDeck.splice(0, 9);
    });
    await updateDoc(doc(db, "games", roomId), {
      deck: newDeck,
      discardPile: [],
      hands,
      currentRound: currentRound + 1,
      roundStatus: "started",
      dealerIndex: newDealerIndex,
      startingPlayerIndex: newStartingIndex,
      currentTurn: players[newStartingIndex]?.id,
    });
    // Immediately update hand for the current player.
    const myHand = hands[playerId] || [];
    setPlayerHand(myHand);
    setDisplayHand(myHand);
    setRoundStatus("started");
    setHasDrawnCard(false);
    // Update local dealer and starting turn indices.
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
      Alert.alert(
        sourceKey === "deck" ? "The deck is empty!" : "The discard pile is empty!"
      );
      return;
    }
    if (playerHand.length >= MAX_CARDS) {
      Alert.alert(
        `You can only have ${MAX_CARDS} cards in your hand. Please discard first.`
      );
      return;
    }
    const drawnCard =
      sourceKey === "deck" ? source[0] : source[source.length - 1];
    const newSource =
      sourceKey === "deck" ? source.slice(1) : source.slice(0, -1);
    const newHand = [...playerHand, drawnCard];
    setPlayerHand(newHand);
    setDisplayHand(newHand);
    await updateDoc(doc(db, "games", roomId), {
      [sourceKey]: newSource,
      [`hands.${playerId}`]: newHand,
    });
    setHasDrawnCard(true);
  };

  const drawFromDeck = useCallback(
    () => drawCard("deck"),
    [deck, playerHand, hasDrawnCard, currentTurn, roundStatus]
  );
  const drawFromDiscard = useCallback(
    () => drawCard("discardPile"),
    [discardPile, playerHand, hasDrawnCard, currentTurn, roundStatus]
  );

  const discardCard = async (index) => {
    if (!isRoundActive) return;
    if (playerId !== currentTurn) {
      Alert.alert("Not your turn!");
      return;
    }
    const cardToDiscard = displayHand[index];
    const cardIndex = playerHand.findIndex(
      (card) =>
        card.rank === cardToDiscard.rank && card.suit === cardToDiscard.suit
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
    const currentPlayerIndex = players.findIndex(
      (player) => player.id === playerId
    );
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    const nextPlayerId = players[nextPlayerIndex]?.id;
    await updateDoc(doc(db, "games", roomId), {
      [`hands.${playerId}`]: newHand,
      discardPile: [...discardPile, discardedCard],
      currentTurn: nextPlayerId,
    });
    setHasDrawnCard(false);
  };

  // Use computed grouping to determine if a valid rump is available.
  const validRumpAvailable = useMemo(
    () => isValidRumpUsingComputedGroups(displayHand),
    [displayHand]
  );

  const handleCardPress = useCallback(
    (index) => {
      if (!isRoundActive) return;
      // When in rump mode, the pressed card is the discard candidate.
      if (rumpMode) {
        const candidateCard = displayHand[index];
        const newHand = displayHand.filter((_, i) => i !== index);
        const groups = computeGroups(newHand);
        const covered = new Array(newHand.length).fill(false);
        groups.forEach((group) => {
          group.indices.forEach((idx) => {
            covered[idx] = true;
          });
        });
        if (covered.every((val) => val)) {
          const currentPlayerIndex = players.findIndex(
            (player) => player.id === playerId
          );
          const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
          const nextPlayerId = players[nextPlayerIndex]?.id;
          updateDoc(doc(db, "games", roomId), {
            [`hands.${playerId}`]: newHand,
            discardPile: [...discardPile, candidateCard],
            roundStatus: "waiting", // End round so only the host can start a new round.
            currentTurn: nextPlayerId,
          }).catch((err) =>
            console.error("Failed to update rump discard", err)
          );
          setRumpMode(false);
        } else {
          Alert.alert("Discarding this card would invalidate your rump!");
        }
        return;
      }

      // Regular discard mode: if active, discard the selected card.
      if (discardMode) {
        discardCard(index);
        setDiscardMode(false);
      } else {
        // If a card is already selected, swap its position with the new index.
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
          }).catch((err) =>
            console.error("Failed to update hand order", err)
          );
          setSelectedCardIndex(null);
        } else {
          setSelectedCardIndex(index);
        }
      }
    },
    [
      rumpMode,
      displayHand,
      discardMode,
      selectedCardIndex,
      roomId,
      playerId,
      players,
      discardPile,
      roundStatus,
    ]
  );

  // Only allow toggling discard or rump modes if the round is active.
  const canToggleDiscard = isRoundActive && playerId === currentTurn && hasDrawnCard && !rumpMode;
  const canToggleRump = isRoundActive && playerId === currentTurn && hasDrawnCard && !discardMode;

  // Rump button style: only glow (green with gold border) when toggled and the hand is valid.
  const rumpButtonStyle = useMemo(() => {
    if (!rumpMode) {
      return { backgroundColor: "#ccc" };
    }
    return validRumpAvailable
      ? { backgroundColor: "#0f0", borderWidth: 3, borderColor: "gold" }
      : { backgroundColor: "#a00" };
  }, [rumpMode, validRumpAvailable]);

  // Highlight valid groups in the UI using computeGroups.
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
        <View style={styles.avatarRow}>
          {players.map((player) => (
            <View
              key={player.id}
              style={[
                styles.avatarContainer,
                avatarContainerSize,
                player.id === currentTurn && styles.currentTurnHighlight,
              ]}
            >
              <Image source={avatars[player.avatar]} style={styles.avatarImage} />
              <Text style={[styles.avatarName, player.id === currentTurn && styles.currentTurnAvatarName]}>
                {player.name}
              </Text>
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
                // Toggle rump mode on/off.
                setRumpMode(!rumpMode);
                if (rumpMode === true) {
                  // When turning off rump mode, also disable discard mode.
                  setDiscardMode(false);
                }
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
                (!isRoundActive ||
                  hasDrawnCard ||
                  discardPile.length === 0 ||
                  playerHand.length >= MAX_CARDS) && styles.disabledDeck,
              ]}
              disabled={!isRoundActive || hasDrawnCard || discardPile.length === 0 || playerHand.length >= MAX_CARDS}
            >
              {discardPile.length > 0 ? (
                <View style={styles.card}>
                  <Text
                    style={[
                      styles.cardText,
                      {
                        color: ["hearts", "diamonds"].includes(
                          discardPile[discardPile.length - 1].suit
                        )
                          ? "red"
                          : "black",
                      },
                    ]}
                  >
                    {discardPile[discardPile.length - 1].rank}{" "}
                    {suitSymbols[discardPile[discardPile.length - 1].suit]}
                  </Text>
                </View>
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
                <Text
                  style={[
                    styles.cardText,
                    {
                      color: ["hearts", "diamonds"].includes(card.suit)
                        ? "red"
                        : "black",
                    },
                  ]}
                >
                  {card.rank} {suitSymbols[card.suit]}
                </Text>
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
  header: { fontSize: 20, fontFamily: "PressStart2P", textAlign: "center", marginBottom: 10 },
  avatarRow: { flexDirection: "row", justifyContent: "center", marginBottom: 10 },
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
  avatarImage: {
    width: "100%",
    height: "80%",
    borderWidth: 4,
    borderTopColor: "#404040",
    borderLeftColor: "#404040",
    borderBottomColor: "#fff",
    borderRightColor: "#fff",
  },
  avatarName: { fontFamily: "PressStart2P", fontSize: 10, marginTop: 5, color: "#000" },
  currentTurnAvatarName: { color: "yellow" },
  deckDiscardContainer: { flexDirection: "row", justifyContent: "space-evenly", marginVertical: 10 },
  deckColumn: {
    alignItems: "center",
  },
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
  discardButtonText: { color: "#000", fontFamily: "PressStart2P", fontSize: 12 },
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
  rumpButtonText: { color: "#000", fontFamily: "PressStart2P", fontSize: 12, textAlign: "center" },
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
  selectedCard: { backgroundColor: "#ffffd0", borderColor: "#ff8800", borderWidth: 2 },
  cardText: { fontFamily: "PressStart2P", fontSize: 12, textAlign: "center" },
});
