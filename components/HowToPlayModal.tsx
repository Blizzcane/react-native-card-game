import React from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';

export default function HowToPlayModal({ visible, onClose }) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>How to Play Rump</Text>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Objective */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Objective</Text>
            <Text style={[styles.bodyText, { color: colors.text }]}>
              Your goal each round is to achieve a <Text style={styles.bold}>Rump</Text>.
            </Text>

            {/* What is a Rump */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>2. What is a Rump?</Text>
            <Text style={[styles.bodyText, { color: colors.text }]}>
              A <Text style={styles.bold}>Rump</Text> is reached when you can arrange all of your cards—except one—into valid groups. In other words, all but one card in your hand must form <Text style={styles.bold}>Sets</Text> or <Text style={styles.bold}>Runs</Text>.
            </Text>

            {/* Valid Groups */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>3. Valid Groups: Sets & Runs</Text>
            <Text style={[styles.bodyText, { color: colors.text }]}>
              <Text style={styles.bold}>Sets</Text> are groups of 3 or more cards that have the same rank (e.g., three 7’s).
            </Text>
            <Text style={[styles.bodyText, { color: colors.text }]}>
              <Text style={styles.bold}>Runs</Text> are sequences of 3 or more cards from the same suit in consecutive order (e.g., 4♥, 5♥, 6♥). An Ace can be used as 1 or 11 when forming a run.
            </Text>

            {/* Ace Values */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>4. Ace Values</Text>
            <Text style={[styles.bodyText, { color: colors.text }]}>
              During play, an Ace can function as either 1 or 11 to help form valid groups. However, if an Ace remains ungrouped at the end of your turn, it counts as 11.
            </Text>

            {/* Card Values */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>5. Card Values</Text>
            <View style={styles.bulletContainer}>
              <Text style={[styles.bodyText, { color: colors.text }]}>• Ace: 1 or 11 (ungrouped counts as 11)</Text>
              <Text style={[styles.bodyText, { color: colors.text }]}>• 2: 2</Text>
              <Text style={[styles.bodyText, { color: colors.text }]}>• 3: 3</Text>
              <Text style={[styles.bodyText, { color: colors.text }]}>• 4: 4</Text>
              <Text style={[styles.bodyText, { color: colors.text }]}>• 5: 5</Text>
              <Text style={[styles.bodyText, { color: colors.text }]}>• 6: 6</Text>
              <Text style={[styles.bodyText, { color: colors.text }]}>• 7: 7</Text>
              <Text style={[styles.bodyText, { color: colors.text }]}>• 8: 8</Text>
              <Text style={[styles.bodyText, { color: colors.text }]}>• 9: 9</Text>
              <Text style={[styles.bodyText, { color: colors.text }]}>• 10: 10</Text>
              <Text style={[styles.bodyText, { color: colors.text }]}>• Jack: 12</Text>
              <Text style={[styles.bodyText, { color: colors.text }]}>• Queen: 13</Text>
              <Text style={[styles.bodyText, { color: colors.text }]}>• King: 14</Text>
            </View>

            {/* Gameplay */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>6. Gameplay</Text>
            <Text style={[styles.bodyText, { color: colors.text }]}>
              • At the start of each round, all players are dealt cards from a shuffled deck.
            </Text>
            <Text style={[styles.bodyText, { color: colors.text }]}>
              • On your turn, draw one card from the deck or the discard pile (only once per turn), then rearrange your hand.
            </Text>
            <Text style={[styles.bodyText, { color: colors.text }]}>
              • Tap on cards to swap their positions, helping you form the required groups.
            </Text>

            {/* Discarding */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>7. Discarding</Text>
            <Text style={[styles.bodyText, { color: colors.text }]}>
              Discard a card to end your turn.
            </Text>

            {/* Rounds & Winning */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>8. Rounds & Game End</Text>
            <Text style={[styles.bodyText, { color: colors.text }]}>
              • A round ends when a player successfully achieves a Rump or when the deck runs out.
            </Text>
            <Text style={[styles.bodyText, { color: colors.text }]}>
              • The game is played over 11 rounds. At the end, the player with the <Text style={styles.bold}>lowest total score</Text> wins.
            </Text>
          </ScrollView>
          <TouchableOpacity 
            onPress={onClose} 
            style={[styles.closeButton, { borderColor: colors.border, backgroundColor: colors.primary }]}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  modalContainer: {
    width: '95%',
    maxHeight: '85%',
    borderRadius: 12,
    padding: 20,
    backgroundColor: '#fff',
    elevation: 10,
    borderWidth: 2,
  },
  title: {
    fontSize: 26,
    fontFamily: 'PressStart2P',
    textAlign: 'center',
    marginBottom: 15,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'PressStart2P',
    marginTop: 10,
    marginBottom: 5,
  },
  bodyText: {
    fontSize: 14,
    fontFamily: 'PressStart2P',
    marginBottom: 10,
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
  },
  bulletContainer: {
    marginLeft: 10,
    marginBottom: 10,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 6,
    alignSelf: 'center',
    borderWidth: 2,
    marginTop: 10,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'PressStart2P',
  },
});
