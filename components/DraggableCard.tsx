import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from "react-native-gesture-handler";

type DraggableCardProps = {
  card: { suit: string; value: string };
  index: number;
  onMove: (fromIndex: number, toIndex: number) => void;
};

export default function DraggableCard({ card, index, onMove }: DraggableCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardWidth = 60; // Approximate card width + spacing

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    zIndex: translateY.value !== 0 ? 1 : 0, // Bring dragged card to front when moving
  }));

  // Gesture setup
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      const toIndex = index + Math.round(translateX.value / cardWidth);

      if (toIndex !== index) {
        runOnJS(onMove)(index, toIndex);
      }

      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  return (
    <GestureHandlerRootView>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.card, animatedStyle]}>
          <Text style={styles.cardText}>{card.value}{card.suit}</Text>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 50,
    height: 70,
    backgroundColor: "white",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#000",
    margin: 5,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    cursor: "grab",
  },
  cardText: { fontSize: 18, fontWeight: "bold" },
});
