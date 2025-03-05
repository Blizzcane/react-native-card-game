import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import TextTicker from "react-native-text-ticker";

// Full playlist array
const playlist = [
  {
    title: "- 3  1 Official HD Video",
    source: require("../assets/music/- 3  1 Official HD Video.mp3"),
  },
  {
    title: "02.Дебора - По същество",
    source: require("../assets/music/02.Дебора - По същество..mp3"),
  },
  {
    title:
      "11.Румънеца и Енчев feat Turbo B (Snap) N.A.S.O & Мариета - Пак на море (Dance version)",
    source: require("../assets/music/11.Румънеца и Енчев feat Turbo B (Snap) N.A.S.O & Мариета - Пак на море (Dance version).mp3"),
  },
  {
    title: "12.Андреа и Азис - Няма друга",
    source: require("../assets/music/12.Андреа и Азис - Няма друга..mp3"),
  },
  {
    title: "18.Емануела - Ром Пом Пом",
    source: require("../assets/music/18.Емануела - Ром Пом Пом..mp3"),
  },
  {
    title: "25.Сиана - Следващо ниво",
    source: require("../assets/music/25.Сиана - Следващо ниво..mp3"),
  },
  {
    title: "28.Саранди - Искам го грубо",
    source: require("../assets/music/28.Саранди - Искам го грубо..mp3"),
  },
  {
    title: "ALISIA - Mr. Greshen - АЛИСИЯ - Мистър Грешен",
    source: require("../assets/music/ALISIA -  Mr. Greshen - АЛИСИЯ -  Мистър Грешен .mp3"),
  },
  {
    title: "ALISIA - DVOYNO POVECHE _ - Official Music Video",
    source: require("../assets/music/ALISIA - DVOYNO POVECHE _  -   Official Music Video.mp3"),
  },
  {
    title: "ANDREA & COSTI IONITA - LAJA GO S TEBE (OFFICIAL SONG) (CD RIP)",
    source: require("../assets/music/ANDREA & COSTI IONITA - LAJA GO S TEBE (OFFICIAL SONG) (CD RIP).mp3"),
  },
  {
    title: "Alisia ft Flori - Vajno li ti e_ Official Video",
    source: require("../assets/music/Alisia ft Flori - Vajno li ti e_  Official Video .mp3"),
  },
  {
    title: "Andrea (Andreea) Teodorova - Hladna Nejnost [HD Videoclip]",
    source: require("../assets/music/Andrea (Andreea) Teodorova - Hladna Nejnost [HD Videoclip].mp3"),
  },
  {
    title: "Azis - Sen Trope  Азис - Сен тропе(mp3)",
    source: require("../assets/music/Azis - Sen Trope  Азис - Сен тропе(mp3).mp3"),
  },
  {
    title: "Azis ft Vanko - Lud me pravish (Official Video)",
    source: require("../assets/music/Azis ft Vanko - Lud me pravish (Official Video).mp3"),
  },
  {
    title: "DESI SLAVA x Azis - ZHADUVAM _ x - Official HD Video Remaster 2004",
    source: require("../assets/music/DESI SLAVA x Azis - ZHADUVAM _   x  -  Official HD Video Remaster 2004.mp3"),
  },
  {
    title: "Dyavolat me kara",
    source: require("../assets/music/Dyavolat me kara.mp3"),
  },
  {
    title: "EMANUELA - BEZ CHUVSTVA _ - 2017",
    source: require("../assets/music/EMANUELA - BEZ CHUVSTVA _  -   2017.mp3"),
  },
  {
    title: "Emanuela i Djordan-Pulno perde 2013",
    source: require("../assets/music/Emanuela i Djordan-Pulno perde 2013.mp3"),
  },
  {
    title: "GALIN ft YANITSA - ROKLYATA TI PADA _ - 2015",
    source: require("../assets/music/GALIN ft YANITSA - ROKLYATA TI PADA _    -    2015.mp3"),
  },
  {
    title: "HD Galena - Sled razdialata.avi",
    source: require("../assets/music/HD Galena - Sled razdialata.avi.mp3"),
  },
  {
    title: "Ivana- Tova e parcheto HQ",
    source: require("../assets/music/Ivana- Tova e parcheto HQ.mp3"),
  },
  {
    title: "KRUM - SHTE ME TURSISH _ - Official Music Video",
    source: require("../assets/music/KRUM - SHTE ME TURSISH _  -    Official Music Video.mp3"),
  },
  {
    title: "Kukla",
    source: require("../assets/music/Kukla.mp3"),
  },
  {
    title: "MARIA DJ JERRY - OBICHAY ME TAKA _ DJ - 2003",
    source: require("../assets/music/MARIA  DJ JERRY - OBICHAY ME TAKA _   DJ  -    2003.mp3"),
  },
  {
    title: "MisterGreshen",
    source: require("../assets/music/MisterGreshen.mp3"),
  },
  {
    title: "Nevionna - Galena - Dai mi - Галена - Дай ми (original video)",
    source: require("../assets/music/Nevionna - Galena - Dai mi - Галена - Дай ми (original video).mp3"),
  },
  {
    title: "Palish me - Alisiq",
    source: require("../assets/music/Palish me - Alisiq.mp3"),
  },
  {
    title: "TEODORA - Karai vkashti - ТЕОДОРА - Карай вкъщи",
    source: require("../assets/music/TEODORA - Karai vkashti - ТЕОДОРА - Карай вкъщи.mp3"),
  },
  {
    title:
      "TONI STORARO & DJAMAIKATA - Dokaji se, brat mi  ТОНИ СТОРАРО & ДЖАМАЙКАТА - Докажи се, брат ми(mp3)",
    source: require("../assets/music/TONI STORARO & DJAMAIKATA - Dokaji se, brat mi  ТОНИ СТОРАРО & ДЖАМАЙКАТА - Докажи се, брат ми(mp3).mp3"),
  },
  {
    title: "TONI STORARO - Nai-sladkata  ТОНИ СТОРАРО - Най-сладката(mp3)",
    source: require("../assets/music/TONI STORARO - Nai-sladkata  ТОНИ СТОРАРО - Най-сладката(mp3).mp3"),
  },
  {
    title: "Trayana - Chasten Sluchai (Official Video) 2012",
    source: require("../assets/music/Trayana - Chasten Sluchai (Official Video) 2012.mp3"),
  },
  {
    title: "Upotrebena feat Costi",
    source: require("../assets/music/Upotrebena feat Costi.mp3"),
  },
  {
    title: "[New] Cvetelina Qneva - Schupeni neshta [Hq]",
    source: require("../assets/music/[New] Cvetelina Qneva - Schupeni neshta [Hq].mp3"),
  },
  {
    title: "feat Mala Rodriguez - Official HD Video",
    source: require("../assets/music/feat Mala Rodriguez -   Official HD Video.mp3"),
  },
  {
    title: "Лияна - Ох, Ох  Liyana - Oh, Oh  HD(mp3)",
    source: require("../assets/music/Лияна - Ох, Ох  Liyana - Oh, Oh  HD(mp3).mp3"),
  },
  {
    title: "Ъпсурт - Звездата [Official HD Video]",
    source: require("../assets/music/Ъпсурт - Звездата [Official HD Video].mp3"),
  },
];

function shuffleArray(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function MusicPlayer({ hideButton = false }) {
  const { width, height } = useWindowDimensions();
  const baseWidth = 1280;
  const baseHeight = 720;
  const scale = Math.min(width / baseWidth, height / baseHeight);

  const [shuffledPlaylist, setShuffledPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const soundRef = useRef(null);

  // Set audio mode on component mount
  useEffect(() => {
    async function setAudioMode() {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
        });
      } catch (error) {
        console.error("Error setting audio mode:", error);
      }
    }
    setAudioMode();
  }, []);

  // Shuffle playlist on mount
  useEffect(() => {
    setShuffledPlaylist(shuffleArray(playlist));
  }, []);

  // Memoized handler for playing the next track
  const handleNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % shuffledPlaylist.length);
  }, [shuffledPlaylist]);

  // Memoized handler for playing the previous track
  const handlePrevious = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      (prevIndex - 1 + shuffledPlaylist.length) % shuffledPlaylist.length
    );
  }, [shuffledPlaylist]);

  // Load current track with cancellation handling
  useEffect(() => {
    if (shuffledPlaylist.length === 0) return;
    let isCancelled = false;

    async function loadCurrentTrack() {
      // Unload previous sound if exists
      if (soundRef.current) {
        try {
          await soundRef.current.unloadAsync();
        } catch (error) {
          console.error("Error unloading sound:", error);
        }
        soundRef.current = null;
      }

      try {
        const { sound } = await Audio.Sound.createAsync(
          shuffledPlaylist[currentIndex].source,
          { shouldPlay: true, isLooping: false }
        );
        if (isCancelled) {
          // If cancelled before setting sound, unload it immediately.
          await sound.unloadAsync();
          return;
        }
        soundRef.current = sound;
        setIsPlaying(true);
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            handleNext();
          }
        });
      } catch (error) {
        console.error("Error loading track:", error);
      }
    }

    loadCurrentTrack();

    return () => {
      isCancelled = true;
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [shuffledPlaylist, currentIndex, handleNext]);

  const togglePlayPause = async () => {
    if (soundRef.current) {
      try {
        if (isPlaying) {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
        } else {
          await soundRef.current.playAsync();
          setIsPlaying(true);
        }
      } catch (error) {
        console.error("Error toggling playback:", error);
      }
    }
  };

  const currentSongTitle =
    shuffledPlaylist.length > 0 ? shuffledPlaylist[currentIndex].title : "";

  return (
    <View style={styles.container(scale)}>
      {!hideButton && (
        <>
          <View style={styles.marqueeContainer(scale)}>
            <View style={styles.innerContainer(scale)}>
              <TextTicker
                style={styles.marqueeText(scale)}
                duration={15000}
                loop
                bounce={false}
                repeatSpacer={50}
                marqueeDelay={1000}
              >
                {currentSongTitle}
              </TextTicker>
            </View>
          </View>
          <View style={styles.buttonRow(scale)}>
            <TouchableOpacity style={styles.button(scale)} onPress={handlePrevious}>
              <Ionicons name="play-skip-back" size={32 * scale} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button(scale)} onPress={togglePlayPause}>
              {isPlaying ? (
                <Ionicons name="pause" size={32 * scale} color="#000" />
              ) : (
                <Ionicons name="play" size={32 * scale} color="#000" />
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.button(scale)} onPress={handleNext}>
              <Ionicons name="play-skip-forward" size={32 * scale} color="#000" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = {
  container: (scale) =>
    StyleSheet.create({
      container: {
        position: "absolute",
        top: 20 * scale,
        right: 20 * scale,
        zIndex: 1000,
        alignItems: "center",
        width: 300 * scale,
      },
    }).container,
  marqueeContainer: (scale) =>
    StyleSheet.create({
      marqueeContainer: {
        width: "100%",
        borderWidth: 4 * scale,
        padding: 5 * scale,
        backgroundColor: "#c3c3c3",
        borderLeftColor: "#fff",
        borderTopColor: "#fff",
        borderRightColor: "#333",
        borderBottomColor: "#333",
        marginBottom: 5 * scale,
      },
    }).marqueeContainer,
  innerContainer: (scale) =>
    StyleSheet.create({
      innerContainer: {
        backgroundColor: "#000",
        padding: 10 * scale,
        borderWidth: 5 * scale,
        borderLeftColor: "#333",
        borderTopColor: "#333",
        borderRightColor: "#fff",
        borderBottomColor: "#fff",
      },
    }).innerContainer,
  marqueeText: (scale) =>
    StyleSheet.create({
      marqueeText: {
        fontFamily: "PressStart2P",
        fontSize: 12 * scale,
        color: "#fff",
        textShadowColor: "#000",
        textShadowOffset: { width: 1 * scale, height: 1 * scale },
        textShadowRadius: 1 * scale,
      },
    }).marqueeText,
  buttonRow: (scale) =>
    StyleSheet.create({
      buttonRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
      },
    }).buttonRow,
  button: (scale) =>
    StyleSheet.create({
      button: {
        width: 60 * scale,
        height: 40 * scale,
        marginHorizontal: 5 * scale,
        backgroundColor: "#c3c3c3",
        borderWidth: 4 * scale,
        borderLeftColor: "#fff",
        borderTopColor: "#fff",
        borderRightColor: "#404040",
        borderBottomColor: "#404040",
        alignItems: "center",
        justifyContent: "center",
      },
    }).button,
};
