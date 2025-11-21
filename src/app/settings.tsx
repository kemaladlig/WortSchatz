import { resetProgress } from '@/db/repository';
import { Moon, Sun, Trash2 } from '@tamagui/lucide-icons';
import { Alert, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Separator, Text, XStack, YStack } from 'tamagui';

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();

    const handleReset = () => {
        Alert.alert(
            "Reset Progress",
            "Are you sure you want to reset all word mastery levels to 0?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset",
                    style: "destructive",
                    onPress: async () => {
                        await resetProgress();
                        Alert.alert("Success", "Progress has been reset.");
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
                    icon={Trash2}
                    theme="red"
                    size="$5"
                >
                    Reset Progress
                </Button>

                <Text fontSize="$3" color="$color10" textAlign="center" mt="$8">
                    WortSchatz v1.0.0
                </Text>
            </YStack>
        </YStack>
    );
}
