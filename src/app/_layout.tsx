import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PortalProvider, TamaguiProvider } from 'tamagui';

import { initDB } from '@/db/repository';
import config from '../../tamagui.config';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // useSystemTheme(); // Disabled to prevent edge-to-edge warnings

  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize Database
        await initDB();

        // Set System Background Color (fixes white bar in edge-to-edge)
        const bgColor = colorScheme === 'dark' ? '#000000' : '#ffffff';
        await SystemUI.setBackgroundColorAsync(bgColor);
      } catch (e) {
        console.warn('Prepare Failed:', e);
      } finally {
        setIsDbReady(true);
      }
    }

    prepare();
  }, [colorScheme]);

  if (!isDbReady) {
    return null; // Or a custom Splash Screen component
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <TamaguiProvider config={config} defaultTheme={colorScheme as any}>
          <PortalProvider shouldAddRootHost>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Stack
                screenOptions={{
                  headerStyle: { backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff' },
                  headerTintColor: colorScheme === 'dark' ? '#ffffff' : '#000000',
                  contentStyle: { backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff' },
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="settings" options={{ title: 'Settings' }} />
                <Stack.Screen name="lesson/[id]" options={{ title: 'Lesson' }} />
                <Stack.Screen name="scenario/[id]" options={{ title: 'Scenario' }} />
                <Stack.Screen name="quiz/game" options={{ title: 'Quiz', presentation: 'fullScreenModal' }} />
              </Stack>
              <StatusBar
                style={colorScheme === 'dark' ? 'light' : 'dark'}
                translucent={false}
                backgroundColor={colorScheme === 'dark' ? '#000000' : '#ffffff'}
              />
            </ThemeProvider>
          </PortalProvider>
        </TamaguiProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
