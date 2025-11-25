import { getStats, getWordsByStatus } from '@/db/repository';
import { Word } from '@/types';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, H2, H4, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui';

export default function StatsScreen() {
    const [stats, setStats] = useState<any>(null);
    const [words, setWords] = useState<Word[]>([]);
    const [viewMode, setViewMode] = useState<'learned' | 'new'>('learned');
    const [isLoading, setIsLoading] = useState(true);
    const insets = useSafeAreaInsets();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const statsData = await getStats();
            setStats(statsData);
            const wordsData = await getWordsByStatus(viewMode, 100); // Limit to 100 for now
            setWords(wordsData);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [viewMode]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const renderWordItem = ({ item }: { item: Word }) => (
        <Card p="$3" mb="$2" bordered>
            <XStack jc="space-between" ai="center">
                <YStack>
                    <XStack ai="center" gap="$2">
                        <Text fontSize="$5" fontWeight="bold">{item.german_word}</Text>
                        <Text fontSize="$3" color="$gray10" fontStyle="italic">{item.article}</Text>
                    </XStack>
                    <Text fontSize="$3" color="$gray11">{item.translation}</Text>
                </YStack>
                <Card px="$2" py="$1" bg={item.level === 'A1' ? '$green3' : item.level === 'A2' ? '$yellow3' : '$red3'}>
                    <Text fontSize="$2" fontWeight="bold">{item.level}</Text>
                </Card>
            </XStack>
        </Card>
    );

    if (!stats && isLoading) {
        return (
            <YStack f={1} ai="center" jc="center">
                <Spinner size="large" />
            </YStack>
        );
    }

    return (
        <YStack f={1} bg="$background" pt={insets.top} px="$4">
            <H2 mb="$4">My Progress</H2>

            {stats && (
                <XStack gap="$3" mb="$4">
                    <Card f={1} p="$3" ai="center" jc="center" bordered>
                        <H4>{stats.learned}</H4>
                        <Paragraph size="$2" color="$gray10">Learned</Paragraph>
                    </Card>
                    <Card f={1} p="$3" ai="center" jc="center" bordered>
                        <H4>{stats.total}</H4>
                        <Paragraph size="$2" color="$gray10">Total Words</Paragraph>
                    </Card>
                </XStack>
            )}

            <XStack mb="$4" bg="$gray3" p="$1" br="$4">
                <Button
                    f={1}
                    size="$3"
                    bg={viewMode === 'learned' ? '$background' : 'transparent'}
                    onPress={() => setViewMode('learned')}
                    chromeless={viewMode !== 'learned'}
                >
                    Learned
                </Button>
                <Button
                    f={1}
                    size="$3"
                    bg={viewMode === 'new' ? '$background' : 'transparent'}
                    onPress={() => setViewMode('new')}
                    chromeless={viewMode !== 'new'}
                >
                    To Learn
                </Button>
            </XStack>

            <FlashList
                data={words}
                renderItem={renderWordItem}
                estimatedItemSize={70}
                contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            />
        </YStack>
    );
}
