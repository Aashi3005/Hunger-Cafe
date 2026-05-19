import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="recipe-generator" options={{ headerShown: false }} />
        <Stack.Screen name="recipe-suggestions" options={{ headerShown: false }} />
        <Stack.Screen name="recipe-detail" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="liked-recipes" options={{ headerShown: false }} />
        <Stack.Screen name="bookmarked-recipes" options={{ headerShown: false }} />
        <Stack.Screen name="cafe-loading" options={{ headerShown: false }} />
        <Stack.Screen name="snacc-screen" options={{ headerShown: false }} />
        <Stack.Screen name="menu-screen" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
