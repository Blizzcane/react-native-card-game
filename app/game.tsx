import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  useWindowDimensions,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { db } from "@/firebaseConfig";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import avatars from "@/utils/avatarLoader";
import MusicPlayer from "../components/MusicPlayer";
import ZZ2 from "../assets/images/ZZ2.gif";

SplashScreen.preventAutoHideAsync();

// Constants for card/suit values and deck generation
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

// --- GlowingBorder Component ---
function GlowingBorder({ active, children }) {
  const glowOpacity = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    if (active) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: false,
          }),
          Animated.timing(glowOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      glowOpacity.stopAnimation();
      glowOpacity.setValue(0);
    }
  }, [active, glowOpacity]);

  return (
    <View style={{ position: "relative" }}>
      <Animated.View
        style={{
          position: "absolute",
          top: -4,
          left: 0,
          right: 0,
          bottom: -4,
          borderRadius: 0,
          borderWidth: 7,
          borderColor: "yellow",
          opacity: glowOpacity,
        }}
      />
      {children}
    </View>
  );
}

// --- Card Images and Helper Functions ---
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

function getCardImage(card) {
  return cardImages[card.suit][card.rank];
}

function getCardValues(card) {
  if (card.rank === "A") return [1, 11];
  if (card.rank === "J") return [12];
  if (card.rank === "Q") return [13];
  if (card.rank === "K") return [14];
  return [parseInt(card.rank, 10)];
}

function getCardScore(card) {
  if (card.rank === "A") return 11;
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

function computeOptimalGrouping(hand) {
  const n = hand.length;
  const memo = new Array(n + 1).fill(null);
  const memoGroups = new Array(n + 1).fill(null);

  function bestRemoval(i) {
    if (i >= n) {
      memo[i] = 0;
      memoGroups[i] = [];
      return 0;
    }
    if (memo[i] !== null) return memo[i];
    let best = bestRemoval(i + 1);
    let bestGroups = memoGroups[i + 1] || [];
    for (let j = i + 3; j <= n; j++) {
      const group = hand.slice(i, j);
      if (isValidGroup(group)) {
        const groupScore = group.reduce((acc, card) => acc + getCardScore(card), 0);
        const candidate = groupScore + bestRemoval(j);
        if (candidate > best) {
          best = candidate;
          bestGroups = [Array.from({ length: j - i }, (_, k) => i + k)].concat(memoGroups[j] || []);
        }
      }
    }
    memo[i] = best;
    memoGroups[i] = bestGroups;
    return best;
  }
  bestRemoval(0);
  return memoGroups[0] || [];
}

function bestRemovalWrapper(hand) {
  const n = hand.length;
  const memo = new Array(n + 1).fill(null);

  function bestRemoval(i) {
    if (i >= n) return 0;
    if (memo[i] !== null) return memo[i];
    let best = bestRemoval(i + 1);
    for (let j = i + 3; j <= n; j++) {
      const group = hand.slice(i, j);
      if (isValidGroup(group)) {
        const groupScore = group.reduce((acc, card) => acc + getCardScore(card), 0);
        best = Math.max(best, groupScore + bestRemoval(j));
      }
    }
    memo[i] = best;
    return best;
  }
  return bestRemoval(0);
}

function computeScoreFromArrangement(hand) {
  const totalScore = hand.reduce((acc, card) => acc + getCardScore(card), 0);
  const removal = bestRemovalWrapper(hand);
  return totalScore - removal;
}

function computeRoundScore(hand) {
  return computeScoreFromArrangement(hand);
}

// --- GameScreen Component ---
export default function GameScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { roomId, playerId } = useLocalSearchParams();
  const { width, height } = useWindowDimensions();

  // Define base dimensions (for 720p: 1280x720) and compute a scaling factor
  const baseWidth = 1280;
  const baseHeight = 720;
  const scaleW = width / baseWidth;
  const scaleH = height / baseHeight;
  const scale = Math.min(scaleW, scaleH);

  // Dynamically scaled sizes for cards
  const cardWidth = 120 * scale;
  const cardHeight = 165 * scale;

  const isLandscape = width > height;
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
  const [showGif, setShowGif] = useState(false);
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
        if (typeof data.dealerIndex === "number")
          setDealerIndex(data.dealerIndex);
        if (typeof data.startingPlayerIndex === "number")
          setStartingPlayerIndex(data.startingPlayerIndex);
        setRoundStatus(data.roundStatus || "waiting");

        if (typeof data.showGif === "boolean") {
          setShowGif(data.showGif);
        }
      } else {
        Alert.alert("Game session not found!");
        router.replace("/lobby");
      }
    });
    return () => unsubscribe();
  }, [roomId, currentTurn, playerId, router]);

  useEffect(() => {
    if (roundStatus === "waiting" && isHost && !scoresUpdated) {
      setScoresUpdated(true);
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
      if (currentRound === 11) {
        updateDoc(doc(db, "games", roomId), { players: updatedPlayers, roundStatus: "gameOver" })
          .catch((err) => console.error("Failed to update scores", err));
      } else {
        updateDoc(doc(db, "games", roomId), { players: updatedPlayers })
          .catch((err) => console.error("Failed to update scores", err));
      }
    }
  }, [roundStatus, isHost, scoresUpdated, players, allHands, roomId, currentRound]);

  const initializeRound = async () => {
    if (!isHost) return;
    if (players.length === 0) {
      Alert.alert("No players available to start the round.");
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
      showGif: true,
    });
    const myHand = hands[playerId] || [];
    setPlayerHand(myHand);
    setDisplayHand(myHand);
    setRoundStatus("started");
    setHasDrawnCard(false);
    setScoresUpdated(false);
    setDealerIndex(newDealerIndex);
    setStartingPlayerIndex(newStartingIndex);

    setTimeout(() => {
      updateDoc(doc(db, "games", roomId), { showGif: false }).catch((err) =>
        console.error("Failed to reset showGif", err)
      );
    }, 5000);
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
    const currentPlayerIndex = players.findIndex((player) => player.id === playerId);
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    const nextPlayerId = players[nextPlayerIndex]?.id;
    await updateDoc(doc(db, "games", roomId), {
      [`hands.${playerId}`]: newHand,
      discardPile: [...discardPile, discardedCard],
      currentTurn: nextPlayerId,
    });
    if (deck.length === 0) {
      Alert.alert("Deck is empty. Ending round.");
      await updateDoc(doc(db, "games", roomId), { roundStatus: "waiting" });
    }
    setHasDrawnCard(false);
  };

  const optimalGroups = useMemo(() => computeOptimalGrouping(displayHand), [displayHand]);
  const highlightMapping = useMemo(() => {
    const mapping = {};
    optimalGroups.forEach((group, i) => {
      group.forEach((index) => {
        mapping[index] = groupColors[i % groupColors.length];
      });
    });
    return mapping;
  }, [optimalGroups]);

  const handleCardPress = useCallback((index) => {
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
  }, [rumpMode, displayHand, discardMode, selectedCardIndex, roomId, playerId, players, discardPile, roundStatus]);

  const canToggleDiscard = isRoundActive && playerId === currentTurn && hasDrawnCard && !rumpMode;
  const canToggleRump = isRoundActive && playerId === currentTurn && hasDrawnCard && !discardMode;

  const rumpButtonStyle = useMemo(() => {
    if (!rumpMode) return { backgroundColor: "#ccc" };
    return validRumpAvailable(displayHand)
      ? { backgroundColor: "#0f0", borderWidth: 3 * scale, borderColor: "gold" }
      : { backgroundColor: "#a00" };
  }, [rumpMode, displayHand, scale]);

  const winner = useMemo(() => {
    if (roundStatus !== "gameOver") return null;
    const sorted = [...players].sort((a, b) => (a.score || 0) - (b.score || 0));
    return sorted[0];
  }, [roundStatus, players]);

  return (
    <SafeAreaView style={[styles.container(scale), { backgroundColor: colors.background }]}>
      {/* Render MusicPlayer. Its absolute positioning ensures it won't interfere with the UI */}
      <MusicPlayer hideButton={showGif} />
      <View style={styles.content(scale)}>
        {isHost && roundStatus === "waiting" && (
          <TouchableOpacity style={styles.startRoundButton(scale)} onPress={initializeRound}>
            <Text style={styles.startRoundText(scale)}>Start Round</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.header(scale), { color: colors.text }]}>
          {roundStatus === "gameOver" ? "Game Over" : `Round ${currentRound}`}
        </Text>
        {roundStatus === "gameOver" && winner && (
          <Text style={[styles.winnerText(scale), { color: colors.text }]}>
            Winner: {winner.name} with {String(winner.score || 0).padStart(3, "0")}
          </Text>
        )}
        <View style={[styles.infoArea(scale), { flexDirection: isLandscape ? "row" : "column" }]}>
          <View style={styles.avatarSection(scale)}>
            {players.map((player) => {
              const isCurrent = player.id === currentTurn;
              const shouldGlow = isCurrent && (player.id === playerId ? !hasDrawnCard : false);
              const avatarContent = (
                <View
                  key={player.id}
                  style={[
                    styles.avatarContainer(scale),
                    isCurrent && styles.currentTurnHighlight(scale),
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarName(scale),
                      isCurrent && styles.currentTurnAvatarName(scale),
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {player.name}
                  </Text>
                  <Image source={avatars[player.avatar]} style={styles.avatarImage(scale)} />
                  {/* Scoreboard styles applied here */}
                  <View style={styles.scoreBorder(scale)}>
                    <Text style={styles.scoreText(scale)} numberOfLines={1} adjustsFontSizeToFit>
                      {String(player.score || 0).padStart(3, "0")}
                    </Text>
                  </View>
                </View>
              );
              return shouldGlow ? (
                <GlowingBorder key={player.id} active={shouldGlow}>
                  {avatarContent}
                </GlowingBorder>
              ) : (
                avatarContent
              );
            })}
          </View>
          <View style={styles.deckDiscardContainer(scale)}>
            <View style={styles.deckColumn(scale)}>
              <TouchableOpacity
                onPress={drawFromDeck}
                style={[
                  styles.deckCard(scale),
                  (!isRoundActive || hasDrawnCard || playerHand.length >= MAX_CARDS) && styles.disabledDeck(scale),
                ]}
                disabled={!isRoundActive || hasDrawnCard || playerHand.length >= MAX_CARDS}
              >
                <Text style={styles.cardText(scale)}>Deck ({deck.length})</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rumpButton(scale), !canToggleRump && styles.disabledButton(scale), rumpButtonStyle]}
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
                <Text style={[styles.rumpButtonText(scale), !canToggleRump && styles.disabledButton(scale), rumpMode ? { color: "#fff" } : { color: "#000" }]}>
                  Rump
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.discardColumn(scale)}>
              <TouchableOpacity
                onPress={drawFromDiscard}
                style={[
                  styles.deckCard(scale),
                  (!isRoundActive || hasDrawnCard || discardPile.length === 0 || playerHand.length >= MAX_CARDS) && styles.disabledDeck(scale),
                ]}
                disabled={!isRoundActive || hasDrawnCard || discardPile.length === 0 || playerHand.length >= MAX_CARDS}
              >
                {discardPile.length > 0 ? (
                  <Image source={getCardImage(discardPile[discardPile.length - 1])} style={styles.cardImage} />
                ) : (
                  <Text style={styles.cardText(scale)}>Empty Discard</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.discardButton(scale),
                  !canToggleDiscard && styles.disabledButton(scale),
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
                <Text style={[styles.discardButtonText(scale), !canToggleDiscard && styles.disabledButton(scale), discardMode ? { color: "#fff" } : { color: "#000" }]}>
                  Discard
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* Only render the hand container if there are cards in displayHand */}
        {displayHand.length > 0 && (
          <View style={styles.handContainer(scale)}>
            {displayHand.map((card, index) => {
              const comboStyle = highlightMapping[index]
                ? { borderColor: highlightMapping[index], borderWidth: 3 * scale }
                : null;
              return (
                <TouchableOpacity
                  key={`${card.rank}-${card.suit}-${index}`}
                  style={[
                    styles.card(scale),
                    { width: cardWidth, height: cardHeight },
                    selectedCardIndex === index && styles.selectedCard(scale),
                    comboStyle,
                  ]}
                  onPress={() => handleCardPress(index)}
                >
                  <Image source={getCardImage(card)} style={styles.cardImage} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
      {showGif && (
        <View style={styles.gifOverlay(scale)}>
          <Image 
            source={ZZ2}
            style={styles.gifImage(scale)}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const validRumpAvailable = (hand) => {
  if (hand.length !== 10) return false;
  for (let i = 0; i < hand.length; i++) {
    const candidateHand = hand.filter((_, idx) => idx !== i);
    if (computeScoreFromArrangement(candidateHand) === 0) {
      return true;
    }
  }
  return false;
};

// Dynamic styles function taking scale as an argument
const styles = {
  container: (scale) =>
    StyleSheet.create({
      container: { flex: 1, padding: 10 * scale },
    }).container,
  content: (scale) =>
    StyleSheet.create({
      content: {
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "center",
        paddingVertical: 20 * scale,
      },
    }).content,
  startRoundButton: (scale) =>
    StyleSheet.create({
      startRoundButton: {
        padding: 10 * scale,
        borderRadius: 3 * scale,
        backgroundColor: "#c3c3c3",
        alignSelf: "center",
        borderWidth: 4 * scale,
        borderLeftColor: "#fff",
        borderTopColor: "#fff",
        borderRightColor: "#404040",
        borderBottomColor: "#404040",
        marginBottom: 10 * scale,
      },
    }).startRoundButton,
  startRoundText: (scale) =>
    StyleSheet.create({
      startRoundText: { color: "#fff", fontFamily: "PressStart2P", fontSize: 14 * scale },
    }).startRoundText,
  header: (scale) =>
    StyleSheet.create({
      header: {
        fontSize: 20 * scale,
        fontFamily: "PressStart2P",
        textAlign: "center",
        marginBottom: 10 * scale,
      },
    }).header,
  winnerText: (scale) =>
    StyleSheet.create({
      winnerText: { fontFamily: "PressStart2P", fontSize: 16 * scale, marginBottom: 10 * scale },
    }).winnerText,
  infoArea: (scale) =>
    StyleSheet.create({
      infoArea: { flex: 1, justifyContent: "space-evenly", alignItems: "center" },
    }).infoArea,
  avatarSection: (scale) =>
    StyleSheet.create({
      avatarSection: { flex: 1, flexDirection: "row", justifyContent: "center", marginHorizontal: 20 * scale },
    }).avatarSection,
  avatarContainer: (scale) =>
    StyleSheet.create({
      avatarContainer: {
        alignItems: "center",
        padding: 5 * scale,
        backgroundColor: "#c3c3c3",
        borderWidth: 4 * scale,
        borderLeftColor: "#fff",
        borderTopColor: "#fff",
        borderRightColor: "#404040",
        borderBottomColor: "#404040",
        marginHorizontal: 5 * scale,
      },
    }).avatarContainer,
  currentTurnHighlight: (scale) =>
    StyleSheet.create({
      currentTurnHighlight: { backgroundColor: "#9e9572" },
    }).currentTurnHighlight,
  avatarName: (scale) =>
    StyleSheet.create({
      avatarName: {
        fontFamily: "PressStart2P",
        fontSize: 10 * scale,
        color: "#000",
        flexShrink: 1,
        minHeight: 15 * scale,
        textAlign: "center",
      },
    }).avatarName,
  currentTurnAvatarName: (scale) =>
    StyleSheet.create({
      currentTurnAvatarName: { color: "yellow" },
    }).currentTurnAvatarName,
  avatarImage: (scale) =>
    StyleSheet.create({
      avatarImage: {
        width: 80 * scale,
        height: 80 * scale,
        borderWidth: 4 * scale,
        borderLeftColor: "#404040",
        borderTopColor: "#404040",
        borderRightColor: "#fff",
        borderBottomColor: "#fff",
      },
    }).avatarImage,
  scoreText: (scale) =>
    StyleSheet.create({
      scoreText: {
        fontFamily: "PressStart2P",
        fontSize: 10 * scale,
        color: "white",
        textAlign: "center",
      },
    }).scoreText,
  scoreBorder: (scale) =>
    StyleSheet.create({
      scoreBorder: {
        borderWidth: 3 * scale,
        backgroundColor: "black",
        borderLeftColor: "#404040",
        borderTopColor: "#404040",
        borderRightColor: "#fff",
        borderBottomColor: "#fff",
        paddingHorizontal: 3 * scale,
        paddingVertical: 2 * scale,
        marginTop: 5 * scale,
        alignSelf: "center",
      },
    }).scoreBorder,
  deckDiscardContainer: (scale) =>
    StyleSheet.create({
      deckDiscardContainer: { flex: 1, flexDirection: "row", justifyContent: "space-evenly", marginVertical: 10 * scale },
    }).deckDiscardContainer,
  deckColumn: (scale) =>
    StyleSheet.create({
      deckColumn: { alignItems: "center" },
    }).deckColumn,
  deckCard: (scale) =>
    StyleSheet.create({
      deckCard: {
        width: 120 * scale,
        height: 165 * scale,
        backgroundColor: "#c3c3c3",
        borderRadius: 5 * scale,
        borderColor: "white",
        borderWidth: 5 * scale,
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        marginHorizontal: 5 * scale,
      },
    }).deckCard,
  disabledDeck: (scale) =>
    StyleSheet.create({
      disabledDeck: { backgroundColor: "#777", opacity: 0.6 },
    }).disabledDeck,
  discardColumn: (scale) =>
    StyleSheet.create({
      discardColumn: { alignItems: "center" },
    }).discardColumn,
  discardButton: (scale) =>
    StyleSheet.create({
      discardButton: {
        padding: 10 * scale,
        marginTop: 10 * scale,
        borderRadius: 3 * scale,
        borderWidth: 4 * scale,
        borderLeftColor: "#fff",
        borderTopColor: "#fff",
        borderRightColor: "#404040",
        borderBottomColor: "#404040",
      },
    }).discardButton,
  discardButtonText: (scale) =>
    StyleSheet.create({
      discardButtonText: {
        color: "#000",
        fontFamily: "PressStart2P",
        fontSize: 12 * scale,
      },
    }).discardButtonText,
  disabledButton: (scale) =>
    StyleSheet.create({
      disabledButton: { opacity: 0.5 },
    }).disabledButton,
  rumpButton: (scale) =>
    StyleSheet.create({
      rumpButton: {
        padding: 10 * scale,
        marginTop: 10 * scale,
        borderRadius: 3 * scale,
        borderWidth: 4 * scale,
        borderLeftColor: "#fff",
        borderTopColor: "#fff",
        borderRightColor: "#404040",
        borderBottomColor: "#404040",
      },
    }).rumpButton,
  rumpButtonText: (scale) =>
    StyleSheet.create({
      rumpButtonText: {
        color: "#000",
        fontFamily: "PressStart2P",
        fontSize: 12 * scale,
        textAlign: "center",
      },
    }).rumpButtonText,
  handContainer: (scale) =>
    StyleSheet.create({
      handContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        padding: 10 * scale,
        backgroundColor: "#c3c3c3",
        borderWidth: 4 * scale,
        borderLeftColor: "#fff",
        borderTopColor: "#fff",
        borderRightColor: "#404040",
        borderBottomColor: "#404040",
        borderRadius: 3 * scale,
      },
    }).handContainer,
  card: (scale) =>
    StyleSheet.create({
      card: {
        backgroundColor: "#fff",
        borderColor: "#000",
        borderWidth: 1 * scale,
        borderRadius: 5 * scale,
        alignItems: "center",
        justifyContent: "center",
        padding: 5 * scale,
        margin: 5 * scale,
      },
    }).card,
  selectedCard: (scale) =>
    StyleSheet.create({
      selectedCard: {
        backgroundColor: "#ffffd0",
        borderColor: "#ff8800",
        borderWidth: 2 * scale,
      },
    }).selectedCard,
  cardText: (scale) =>
    StyleSheet.create({
      cardText: { fontFamily: "PressStart2P", fontSize: 12 * scale, textAlign: "center" },
    }).cardText,
  cardImage: StyleSheet.create({
    cardImage: {
      width: "100%",
      height: "100%",
      resizeMode: "contain",
    },
  }).cardImage,
  gifOverlay: (scale) =>
    StyleSheet.create({
      gifOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "black",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
      },
    }).gifOverlay,
  gifImage: (scale) =>
    StyleSheet.create({
      gifImage: {
        width: "100%",
        height: "100%",
        resizeMode: "contain",
      },
    }).gifImage,
};

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
