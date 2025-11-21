import * as NavigationBar from 'expo-navigation-bar';
import { useEffect } from 'react';
import { Platform, useColorScheme } from 'react-native';

export function useSystemTheme() {
    const colorScheme = useColorScheme();

    useEffect(() => {
        if (Platform.OS !== 'android') return;

        const updateSystemBars = async () => {
            const isDark = colorScheme === 'dark';

            // Define colors
            const backgroundColor = isDark ? '#000000' : '#ffffff';
            const buttonStyle = isDark ? 'light' : 'dark';

            try {
                // 1. Set the background color explicitly
                await NavigationBar.setBackgroundColorAsync(backgroundColor);

                // 2. Set the button style (icon colors)
                await NavigationBar.setButtonStyleAsync(buttonStyle);

                // 3. Ensure the bar is visible and not transparent/floating unless intended
                // 'absolute' allows content to flow under, but we want to ensure contrast.
                // If we want a solid bar:
                await NavigationBar.setPositionAsync('relative');

                // 4. Optional: Hide the divider if it clashes
                await NavigationBar.setBorderColorAsync(backgroundColor);
            } catch (e) {
                console.warn('Failed to update system bars:', e);
            }
        };

        updateSystemBars();
    }, [colorScheme]);
}
