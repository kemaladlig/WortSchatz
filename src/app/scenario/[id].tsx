import { getPhrasesByScenarioId, getScenarioById } from '@/db/repository';
import { Play, Volume2 } from '@tamagui/lucide-icons';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Spinner, Text, XStack, YStack } from 'tamagui';

interface Scenario {
    id: number;
    title: string;
    icon_name: string;
    color_theme: string;
}

interface Phrase {
    id: number;
    german_text: string;
    english_text: string;
    audio_speed: number;
}

export default function ScenarioDetailScreen() {
    const { id } = useLocalSearchParams();
    const [scenario, setScenario] = useState<Scenario | null>(null);
    const [phrases, setPhrases] = useState<Phrase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPlayingAll, setIsPlayingAll] = useState(false);
    const [activePhraseId, setActivePhraseId] = useState<number | null>(null);

    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    useEffect(() => {
        const loadData = async () => {
            if (id) {
                const [scenarioData, phrasesData] = await Promise.all([
                    getScenarioById(Number(id)),
                    getPhrasesByScenarioId(Number(id))
                ]);
                setScenario(scenarioData as Scenario);
                setPhrases(phrasesData as Phrase[]);
                setIsLoading(false);
            }
        };
        loadData();
    }, [id]);

    useEffect(() => {
        if (scenario) {
            navigation.setOptions({ title: scenario.title });
        }
    }, [scenario, navigation]);

    const playPhrase = async (phrase: Phrase) => {
        if (activePhraseId === phrase.id) return; // Already playing

        setActivePhraseId(phrase.id);
        Speech.stop();
        Speech.speak(phrase.german_text, {
            language: 'de-DE',
            rate: 0.9,
            onDone: () => setActivePhraseId(null),
            onError: (e) => {
                console.warn('Speech error:', e);
                setActivePhraseId(null);
            },
        });
    };

    const playAll = async () => {
        if (isPlayingAll) {
            Speech.stop();
            setIsPlayingAll(false);
            setActivePhraseId(null);
            return;
        }

        setIsPlayingAll(true);

        for (const phrase of phrases) {
            if (!isPlayingAll) break; // Check if stopped

            setActivePhraseId(phrase.id);

            await new Promise<void>((resolve) => {
                Speech.speak(phrase.german_text, {
                    language: 'de-DE',
                    rate: 0.9,
                    onDone: () => {
                        setTimeout(resolve, 500); // Pause between phrases
                    },
                    onError: (e) => {
                        console.warn('Speech error:', e);
                        resolve();
                    },
                });
            });
        }

        setIsPlayingAll(false);
        setActivePhraseId(null);
    };

    if (isLoading || !scenario) {
        return (
            <YStack f={1} ai="center" jc="center" bg="$background">
                <Spinner size="large" color="$color" />
            </YStack>
        );
    }

    return (
        <YStack f={1} bg="$background">
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 80 }}>
                <YStack gap="$4">
                    {phrases.map((phrase) => (
                        <Card
                            key={phrase.id}
                            bordered
                            p="$4"
                            animation="bouncy"
                            pressStyle={{ scale: 0.98 }}
                            onPress={() => playPhrase(phrase)}
                            bg={activePhraseId === phrase.id ? '$blue3' : '$background'}
                            borderColor={activePhraseId === phrase.id ? '$blue8' : '$borderColor'}
                        >
                            <XStack ai="center" gap="$3">
                                <YStack
                                    w={40}
                                    h={40}
                                    br="$10"
                                    bg={activePhraseId === phrase.id ? '$blue8' : '$color3'}
                                    ai="center"
                                    jc="center"
                                >
                                    <Volume2 size={20} color={activePhraseId === phrase.id ? 'white' : '$color'} />
                                </YStack>
                                <YStack f={1}>
                                    <Text fontSize="$6" fontWeight="bold" color="$color">
                                        {phrase.german_text}
                                    </Text>
                                    <Text fontSize="$4" color="$color10" mt="$1">
                                        {phrase.english_text}
                                    </Text>
                                </YStack>
                            </XStack>
                        </Card>
                    ))}
                </YStack>
            </ScrollView>

            {/* Floating Play All Button */}
            <YStack
                pos="absolute"
                bottom={insets.bottom + 20}
                left={0}
                right={0}
                ai="center"
            >
                <Button
                    size="$5"
                    theme={isPlayingAll ? 'red' : 'blue'}
                    icon={isPlayingAll ? undefined : Play}
                    onPress={playAll}
                    w={200}
                >
                    {isPlayingAll ? 'Stop Playing' : 'Play All'}
                </Button>
            </YStack>
        </YStack>
    );
}
