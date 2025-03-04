import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import avatars from "@/utils/avatarLoader";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function PlayerSetupScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();

  // Base dimensions for scaling (assume a base 1280 x 720 design)
  const baseWidth = 1280;
  const baseHeight = 720;
  const scaleW = width / baseWidth;
  const scaleH = height / baseHeight;
  const scale = Math.min(scaleW, scaleH);

  const [playerName, setPlayerName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("Z1"); // Default avatar

  // For the avatar pulse animation when selected
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [fontsLoaded] = useFonts({
    PressStart2P: require("../assets/fonts/PressStart2P-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  // When an avatar is selected, run a quick pulse animation.
  const animateAvatar = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onSelectAvatar = (item) => {
    setSelectedAvatar(item);
    animateAvatar();
  };

  // Handle "Continue" button - Ensure name & avatar are selected
  const enterLobby = () => {
    if (!playerName.trim()) {
      alert("Please enter a name!");
      return;
    }
    router.push({
      pathname: "/lobby",
      params: { playerName, selectedAvatar },
    });
  };

  return (
    <SafeAreaView style={[styles.container(scale)]}>
      {/* Name Input */}
      <TextInput
        style={styles.input(scale)}
        placeholder={t("Enter Your Name")}
        placeholderTextColor="#555"
        value={playerName}
        onChangeText={setPlayerName}
      />

      {/* Avatar Selection */}
      <Text style={styles.subHeader(scale)}>{t("Pick an avatar")}</Text>
      <FlatList
        data={Object.keys(avatars)}
        keyExtractor={(item) => item}
        numColumns={4}
        contentContainerStyle={styles.avatarContainer(scale)}
        columnWrapperStyle={styles.avatarRow(scale)}
        renderItem={({ item }) => {
          const isSelected = selectedAvatar === item;
          return (
            <TouchableOpacity onPress={() => onSelectAvatar(item)}>
              <Animated.Image
                source={avatars[item]}
                style={[
                  styles.avatar(scale),
                  isSelected && styles.selectedAvatar(scale), // Yellow border overrides default
                  isSelected && { transform: [{ scale: pulseAnim }] },
                ]}
              />
            </TouchableOpacity>
          );
        }}
      />

      {/* Continue Button */}
      <TouchableOpacity style={styles.button(scale)} onPress={enterLobby}>
        <Text style={styles.buttonText(scale)}>{t("continue")}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = {
  container: (scale) =>
    StyleSheet.create({
      container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20 * scale,
        backgroundColor: "#008183",
      },
    }).container,
  input: (scale) =>
    StyleSheet.create({
      input: {
        borderWidth: 2 * scale,
        padding: 10 * scale,
        width: "60%",
        marginVertical: 10 * scale,
        textAlign: "center",
        borderLeftColor: "#fff",
        borderTopColor: "#fff",
        borderRightColor: "#404040",
        borderBottomColor: "#404040",
        backgroundColor: "#c3c3c3",
        color: "#000",
        fontFamily: "PressStart2P",
        fontSize: 15 * scale,
      },
    }).input,
  subHeader: (scale) =>
    StyleSheet.create({
      subHeader: {
        fontSize: 16 * scale,
        fontFamily: "PressStart2P",
        textAlign: "center",
        marginVertical: 10 * scale,
        color: "#fff",
      },
    }).subHeader,
  button: (scale) =>
    StyleSheet.create({
      button: {
        backgroundColor: "#c3c3c3",
        padding: 10 * scale,
        marginVertical: 10 * scale,
        borderRadius: 3 * scale,
        borderWidth: 4 * scale,
        borderLeftColor: "#fff",
        borderTopColor: "#fff",
        borderRightColor: "#404040",
        borderBottomColor: "#404040",
      },
    }).button,
  buttonText: (scale) =>
    StyleSheet.create({
      buttonText: {
        color: "#000",
        fontFamily: "PressStart2P",
        textAlign: "center",
        fontSize: 14 * scale,
      },
    }).buttonText,
  avatarContainer: (scale) =>
    StyleSheet.create({
      avatarContainer: {
        width: "100%",
        backgroundColor: "#c3c3c3",
        marginVertical: 10 * scale,
        padding: 10 * scale,
        borderWidth: 5 * scale,
        borderLeftColor: "#fff",
        borderTopColor: "#fff",
        borderRightColor: "#404040",
        borderBottomColor: "#404040",
      },
    }).avatarContainer,
  avatarRow: (scale) =>
    StyleSheet.create({
      avatarRow: {
        width: "100%",
        justifyContent: "space-evenly",
      },
    }).avatarRow,
  avatar: (scale) =>
    StyleSheet.create({
      avatar: {
        width: 100 * scale,
        height: 100 * scale,
        margin: 3 * scale,
        borderWidth: 4 * scale,
        borderTopColor: "#404040",
        borderLeftColor: "#404040",
        borderBottomColor: "#fff",
        borderRightColor: "#fff",
      },
    }).avatar,
  selectedAvatar: (scale) =>
    StyleSheet.create({
      selectedAvatar: {
        borderWidth: 8 * scale,
        borderTopColor: "yellow",
        borderLeftColor: "yellow",
        borderBottomColor: "yellow",
        borderRightColor: "yellow",
      },
    }).selectedAvatar,
};
