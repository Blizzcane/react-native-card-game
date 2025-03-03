// components/MusicPlayer.tsx
import React, { useState, useEffect, useRef } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Audio } from "expo-av";

interface MusicPlayerProps {
  hideButton?: boolean;
}

export default function MusicPlayer({ hideButton = false }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    async function loadSound() {
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/music/MisterGreshen.mp3"),
        { shouldPlay: true, isLooping: true }
      );
      soundRef.current = sound;
    }
    loadSound();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const toggleMusic = async () => {
    if (soundRef.current) {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <View style={styles.container}>
      {!hideButton && (
        <TouchableOpacity style={styles.button} onPress={toggleMusic}>
          <Text style={styles.buttonText}>
            {isPlaying ? "Music On" : "Music Off"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 1000,
  },
  button: {
    padding: 10,
    borderRadius: 3,
    backgroundColor: "#c3c3c3",
    borderWidth: 4,
    borderLeftColor: "#fff",
    borderTopColor: "#fff",
    borderRightColor: "#404040",
    borderBottomColor: "#404040",
  },
  buttonText: {
    fontFamily: "PressStart2P",
    fontSize: 12,
    color: "#000",
    textAlign: "center",
  },
});
