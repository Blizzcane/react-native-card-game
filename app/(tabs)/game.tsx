import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Button, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import DraggableCard from "@/components/DraggableCard";

const SUITS = ["♠", "♥", "♦", "♣"];
const VALUES = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

const createDeck = () => {
  let deck = [];
  for (let suit of SUITS) {
    for (let value of VALUES) {
      deck.push({ suit, value });
    }
  }
  return deck;
};

const shuffleDeck = (deck) => {
  let shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function GameScreen() {
    const [hands, setHands] = useState([]);
  
    const moveCard = (playerIndex: number, fromIndex: number, toIndex: number) => {
      setHands((prevHands) => {
        const updatedHands = [...prevHands];
        const hand = [...updatedHands[playerIndex]];
        
        if (toIndex < 0 || toIndex >= hand.length) return updatedHands; // Prevent out of bounds
        
        // Remove and reinsert card
        const [movedCard] = hand.splice(fromIndex, 1);
        hand.splice(toIndex, 0, movedCard);
  
        updatedHands[playerIndex] = hand;
        return updatedHands;
      });
    };
  
    return (
      <FlatList
        data={hands}
        renderItem={({ item, index }) => (
          <View style={styles.cardRow}>
            {item.map((card, cardIndex) => (
              <DraggableCard
                key={`card-${cardIndex}`}
                card={card}
                index={cardIndex}
                onMove={(fromIndex, toIndex) => moveCard(index, fromIndex, toIndex)}
              />
            ))}
          </View>
        )}
      />
    );
  }
  

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: "center" },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  dealer: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
  currentTurn: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  playerHand: { marginBottom: 15 },
  playerTitle: { fontSize: 18, fontWeight: "bold" },
  cardRow: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap" },
});
