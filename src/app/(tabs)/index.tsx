import { DailyGoalHeader } from '@/components/deck/DailyGoalHeader';
import { useDeck } from '@/hooks/useDeck';
import { Settings } from '@tamagui/lucide-icons';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Spinner, Text, View, YStack } from 'tamagui';
import { WordCard } from '../../components/deck/WordCard';

export default function DeckScreen() {
    const { words, isLoading, handleSwipeLeft, handleSwipeRight, refresh } = useDeck();
    const insets = useSafeAreaInsets();

    if (isLoading && words.length === 0) {
        return (
            <YStack f={1} ai="center" jc="center" bg="$background">
                <Spinner size="large" color="$color" />
            </YStack>
        );
    }

    if (words.length === 0) {
        return (
            <YStack f={1} ai="center" jc="center" bg="$background" p="$4" pb={insets.bottom}>
                <Text fontSize="$6" textAlign="center" mb="$4">
                    All caught up for now!
                </Text>
                <Button onPress={refresh}>Load More</Button>
                <Link href="/settings" asChild>
                    <Button mt="$4" variant="outlined">Settings</Button>
                </Link>
            </YStack>
        );
    }

    return (
        <YStack f={1} bg="$background" pt={insets.top} pb={insets.bottom}>
            <DailyGoalHeader />

            <YStack f={1} ai="center" jc="center">
                <View style={{ width: '100%', height: 600, alignItems: 'center', justifyContent: 'center' }}>
                    {words.map((word, index) => (
                        <WordCard
                            key={word.id}
                            word={word}
                            index={index}
                            onSwipeLeft={() => handleSwipeLeft(word.id)}
                            onSwipeRight={() => handleSwipeRight(word.id, word.mastery_level)}
                        />
                    )).reverse()}
                </View>
            </YStack>

            <Link href="/settings" asChild>
                <Button pos="absolute" bottom={insets.bottom + 20} right="$4" size="$3" circular icon={Settings} />
            </Link>
        </YStack>
    );
}
