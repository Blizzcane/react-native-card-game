import 'react-native-gesture-handler'; // Must be at the very top
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [fontsLoaded] = useFonts({
    PressStart2P: require('../assets/fonts/PressStart2P-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>{t("Rump")}</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push("/PlayerSetup")}>
        <Text style={styles.buttonText}>{t("Enter Lobby")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  header: { 
    fontSize: 20, 
    fontFamily: 'PressStart2P', 
    textAlign: 'center', 
    marginBottom: 20 
  },
  button: { 
    backgroundColor: '#c3c3c3', 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    borderRadius: 3,
    borderWidth: 5,
    borderLeftColor: '#fff',      // Lighter on left
    borderTopColor: '#fff',       // Lighter on top
    borderRightColor: '#404040',  // Darker on right
    borderBottomColor: '#404040', // Darker on bottom
    marginVertical: 5,
  },
  buttonText: { 
    fontSize: 14, 
    fontFamily: 'PressStart2P', 
    color: '#000', 
    textAlign: 'center' 
  },
});
