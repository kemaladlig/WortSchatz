import { resetProgress } from '@/db/repository';
import { useAppStore } from '@/store/useAppStore';
import { Moon, Sun, Trash2 } from '@tamagui/lucide-icons';
import { useState } from 'react';
import { Alert, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Separator, Spinner, Text, XStack, YStack } from 'tamagui';

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const [isResetting, setIsResetting] = useState(false);
    const { resetDailyProgress } = useAppStore();

    const handleReset = () => {
        Alert.alert(
            "Reset Progress",
            "Are you sure you want to reset all word mastery levels to 0? This will also reset your daily progress.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset",
                    style: "destructive",
                    onPress: async () => {
                        setIsResetting(true);
                        try {
                            await resetProgress();
                            // Reset daily progress as well
                            resetDailyProgress();
                            Alert.alert("Success", "All progress has been reset.");
                        } catch (error) {
                            Alert.alert("Error", "Failed to reset progress.");
                            console.error(error);
                        } finally {
                            setIsResetting(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <YStack f={1} bg="$background" p="$4" pb={insets.bottom + 20}>
            <YStack gap="$4">
                <Text fontSize="$8" fontWeight="bold">Settings</Text>

                <XStack ai="center" jc="space-between" p="$4" bg="$color2" borderRadius="$4">
                    <XStack gap="$3" ai="center">
                        {colorScheme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                        <Text fontSize="$5">Appearance</Text>
                    </XStack>
                    <Text color="$color10">{colorScheme === 'dark' ? 'Dark Mode' : 'Light Mode'}</Text>
                </XStack>

                <Separator />

                <Button
                    onPress={handleReset}
                    icon={isResetting ? Spinner : Trash2}
                    theme="red"
                    size="$5"
                    disabled={isResetting}
                >
                    {isResetting ? 'Resetting...' : 'Reset Progress'}
                </Button>

                <Text fontSize="$3" color="$color10" textAlign="center" mt="$8">
                    WortSchatz v1.0.0
                </Text>
            </YStack>
        </YStack>
    );
}
