import React, { useState, useEffect, useRef } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Audio } from "expo-av";

// Import all songs by their file names (ensure these names match exactly with your assets)
const playlist = [
  require("../assets/music/- 3  1 Official HD Video.mp3"),
  require("../assets/music/02.Дебора - По същество..mp3"),
  require("../assets/music/11.Румънеца и Енчев feat Turbo B (Snap) N.A.S.O & Мариета - Пак на море (Dance version).mp3"),
  require("../assets/music/12.Андреа и Азис - Няма друга..mp3"),
  require("../assets/music/18.Емануела - Ром Пом Пом..mp3"),
  require("../assets/music/25.Сиана - Следващо ниво..mp3"),
  require("../assets/music/28.Саранди - Искам го грубо..mp3"),
  require("../assets/music/ALISIA -  Mr. Greshen - АЛИСИЯ -  Мистър Грешен .mp3"),
  require("../assets/music/ALISIA - DVOYNO POVECHE _  -   Official Music Video.mp3"),
  require("../assets/music/ANDREA & COSTI IONITA - LAJA GO S TEBE (OFFICIAL SONG) (CD RIP).mp3"),
  require("../assets/music/Alisia ft Flori - Vajno li ti e_  Official Video .mp3"),
  require("../assets/music/Andrea (Andreea) Teodorova - Hladna Nejnost [HD Videoclip].mp3"),
  require("../assets/music/Azis - Sen Trope  Азис - Сен тропе(mp3).mp3"),
  require("../assets/music/Azis ft Vanko - Lud me pravish (Official Video).mp3"),
  require("../assets/music/DESI SLAVA x Azis - ZHADUVAM _   x  -  Official HD Video Remaster 2004.mp3"),
  require("../assets/music/Dyavolat me kara.mp3"),
  require("../assets/music/EMANUELA - BEZ CHUVSTVA _  -   2017.mp3"),
  require("../assets/music/Emanuela i Djordan-Pulno perde 2013.mp3"),
  require("../assets/music/GALIN ft YANITSA - ROKLYATA TI PADA _    -    2015.mp3"),
  require("../assets/music/HD Galena - Sled razdialata.avi.mp3"),
  require("../assets/music/Ivana- Tova e parcheto HQ.mp3"),
  require("../assets/music/KRUM - SHTE ME TURSISH _  -    Official Music Video.mp3"),
  require("../assets/music/Kukla.mp3"),
  require("../assets/music/MARIA  DJ JERRY - OBICHAY ME TAKA _   DJ  -    2003.mp3"),
  require("../assets/music/MisterGreshen.mp3"),
  require("../assets/music/Nevionna - Galena - Dai mi - Галена - Дай ми (original video).mp3"),
  require("../assets/music/Palish me - Alisiq.mp3"),
  require("../assets/music/TEODORA - Karai vkashti - ТЕОДОРА - Карай вкъщи.mp3"),
  require("../assets/music/TONI STORARO & DJAMAIKATA - Dokaji se, brat mi  ТОНИ СТОРАРО & ДЖАМАЙКАТА - Докажи се, брат ми(mp3).mp3"),
  require("../assets/music/TONI STORARO - Nai-sladkata  ТОНИ СТОРАРО - Най-сладката(mp3).mp3"),
  require("../assets/music/Trayana - Chasten Sluchai (Official Video) 2012.mp3"),
  require("../assets/music/Upotrebena feat Costi.mp3"),
  require("../assets/music/[New] Cvetelina Qneva - Schupeni neshta [Hq].mp3"),
  require("../assets/music/feat Mala Rodriguez -   Official HD Video.mp3"),
  require("../assets/music/Лияна - Ох, Ох  Liyana - Oh, Oh  HD(mp3).mp3"),
  require("../assets/music/Ъпсурт - Звездата [Official HD Video].mp3")
];

// Fisher-Yates shuffle for random order
function shuffleArray(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function MusicPlayer({ hideButton = false }) {
  const [shuffledPlaylist, setShuffledPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const soundRef = useRef(null);

  // Shuffle the playlist on mount
  useEffect(() => {
    setShuffledPlaylist(shuffleArray(playlist));
  }, []);

  // Load and play the current track when the playlist is ready or when currentIndex changes
  useEffect(() => {
    async function loadTrack(index) {
      // Unload the previous track if it exists
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      try {
        const { sound } = await Audio.Sound.createAsync(
          shuffledPlaylist[index],
          { shouldPlay: true, isLooping: false }
        );
        soundRef.current = sound;
        setIsPlaying(true);
        // Automatically play the next track when the current one finishes
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            handleNext();
          }
        });
      } catch (error) {
        console.error("Error loading track:", error);
      }
    }
    if (shuffledPlaylist.length > 0) {
      loadTrack(currentIndex);
    }
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [shuffledPlaylist, currentIndex]);

  // Toggle play/pause functionality
  const togglePlayPause = async () => {
    if (soundRef.current) {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    }
  };

  // Next and Previous controls with wrap-around
  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % shuffledPlaylist.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) =>
      (prevIndex - 1 + shuffledPlaylist.length) % shuffledPlaylist.length
    );
  };

  return (
    <View style={styles.container}>
      {!hideButton && (
        <>
          <TouchableOpacity style={styles.button} onPress={togglePlayPause}>
            <Text style={styles.buttonText}>
              {isPlaying ? "Pause" : "Play"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handlePrevious}>
            <Text style={styles.buttonText}>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </>
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
    marginVertical: 5,
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
