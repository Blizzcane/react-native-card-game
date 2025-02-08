import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Button, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

const SUITS = ["♠", "♥", "♦", "♣"];
const VALUES = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

// Function to generate a deck of 52 cards
const createDeck = () => {
  let deck = [];
  for (let suit of SUITS) {
    for (let value of VALUES) {
      deck.push({ suit, value });
    }
  }
  return deck;
};

// Function to shuffle the deck
const shuffleDeck = (deck) => {
  let shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements
  }
  return shuffled;
};

export default function GameScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { playerCount } = useLocalSearchParams();
  const [deck, setDeck] = useState([]);
  const [hands, setHands] = useState([]);
  const [discardPile, setDiscardPile] = useState(null);
  const [round, setRound] = useState(1);

  // Start the game by shuffling and dealing cards
  useEffect(() => {
    startNewRound();
  }, []);

  const startNewRound = () => {
    let newDeck = shuffleDeck(createDeck()); // Shuffle a fresh deck
    let newHands = [];
    let numPlayers = parseInt(playerCount) || 4; // Default to 4 players if not provided

    // Deal 9 cards to each player
    for (let i = 0; i < numPlayers; i++) {
      newHands.push(newDeck.splice(0, 9)); // Take 9 cards for each player
    }

    // Set the discard pile only if fewer than 4 players
    let newDiscardPile = numPlayers < 4 ? newDeck.shift() : null;

    setDeck(newDeck);
    setHands(newHands);
    setDiscardPile(newDiscardPile);
    setRound(1);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t("round")} {round} / 11</Text>

      {/* Show each player's hand */}
      <FlatList
        data={hands}
        keyExtractor={(item, index) => `player-${index}`}
        renderItem={({ item, index }) => (
          <View style={styles.playerHand}>
            <Text style={styles.playerTitle}>{t("player", { number: index + 1 })}</Text>
            <Text>{item.map((card) => `${card.value}${card.suit}`).join(", ")}</Text>
          </View>
        )}
      />

      {/* Show discard pile */}
      {discardPile && (
        <View style={styles.discardPile}>
          <Text style={styles.discardText}>{t("discard_pile")}:</Text>
          <Text style={styles.card}>{discardPile.value}{discardPile.suit}</Text>
        </View>
      )}

      <Button title={t("next_round")} onPress={startNewRound} />
      <Button title={t("exit_game")} onPress={() => router.push("/")} color="red" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: "center" },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  playerHand: { marginBottom: 15 },
  playerTitle: { fontSize: 18, fontWeight: "bold" },
  discardPile: { marginTop: 20, padding: 10, borderWidth: 1, borderRadius: 5 },
  discardText: { fontSize: 18, fontWeight: "bold" },
  card: { fontSize: 24 },
});
