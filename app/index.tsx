import 'react-native-gesture-handler'; // Must be at the very top
import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';

// Prevent the splash screen from auto hiding
SplashScreen.preventAutoHideAsync();

// Create an Animated version of TouchableOpacity
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [fontsLoaded] = useFonts({
    PressStart2P: require('../assets/fonts/PressStart2P-Regular.ttf'),
  });

  // Animation refs for header and button
  const headerAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      // Animate header and button: fade in and slide up
      Animated.stagger(300, [
        Animated.timing(headerAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(buttonAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fontsLoaded, headerAnim, buttonAnim]);

  if (!fontsLoaded) {
    return null;
  }

  // Button press animation handlers
  const onPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.9, // more noticeable scale down
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <LinearGradient
      colors={[colors.primary, colors.background]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.container}>
        <Animated.Text
          style={[
            styles.header,
            { color: colors.text },
            {
              opacity: headerAnim,
              transform: [
                {
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {t("Rump")}
        </Animated.Text>
        <AnimatedTouchable
          style={[
            styles.button,
            {
              opacity: buttonAnim,
              transform: [
                {
                  translateY: buttonAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
                { scale: buttonScale },
              ],
            },
          ]}
          onPress={() => router.push("/PlayerSetup")}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
        >
          <Text style={styles.buttonText}>{t("Enter Lobby")}</Text>
        </AnimatedTouchable>
        {/* Persistent text at the bottom right */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Crafted with Passion by Vasil</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'relative', // Allow absolute positioning for footer
  },
  // Increased fontSize for a bigger title
  header: { 
    fontSize: 32, 
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
  footer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  footerText: {
    fontSize: 10,
    fontFamily: 'PressStart2P',
    color: '#888',
  },
});
