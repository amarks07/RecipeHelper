import * as Font from "expo-font";
import { useState, useEffect } from "react";

export function useFonts() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          FingerPaint: require("../../assets/fonts/FingerPaint-Regular.ttf"),
        });
        setFontsLoaded(true);
      } catch (e) {
        console.error("Error loading fonts:", e);
        setFontsLoaded(true); // Continue anyway
      }
    }

    loadFonts();
  }, []);

  return fontsLoaded;
}
