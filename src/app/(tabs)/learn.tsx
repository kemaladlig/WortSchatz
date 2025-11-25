import { getLessons, getScenarios } from '@/db/repository';
import { FlashList } from '@shopify/flash-list';
import { Ambulance, Check, ChevronRight, Coffee, MessageCircle, User } from '@tamagui/lucide-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Spinner, Text, XStack, YStack } from 'tamagui';

interface Lesson {
    id: number;
    title: string;
    order_index: number;
    is_completed: number;
}

interface Scenario {
    id: number;
    title: string;
    icon_name: string;
    color_theme: string;
}

const iconMap: Record<string, any> = {
    coffee: Coffee,
    user: User,
    ambulance: Ambulance,
};

// Memoized Scenario Card Component
const ScenarioCard = memo(({ item, onPress }: { item: Scenario; onPress: (id: number) => void }) => {
    const Icon = iconMap[item.icon_name] || MessageCircle;
    return (
        <Card
            w={160}
            h={180}
            bordered
            animation="bouncy"
            scale={0.98}
            hoverStyle={{ scale: 1 }}
            pressStyle={{ scale: 0.96 }}
            onPress={() => onPress(item.id)}
            p="$4"
            bg={item.color_theme as any}
            jc="space-between"
            mr="$3"
        >
            <YStack
                w={40}
                h={40}
                bg="rgba(255,255,255,0.2)"
                br="$10"
                ai="center"
                jc="center"
            >
                <Icon size={24} color="white" />
            </YStack>
            <Text fontSize="$6" fontWeight="bold" color="white">
                {item.title}
            </Text>
        </Card>
    );
});

// Memoized Lesson Card Component
const LessonCard = memo(({ item, onPress }: { item: Lesson; onPress: (id: number) => void }) => (
    <Card
        bordered
        animation="bouncy"
        scale={0.98}
        hoverStyle={{ scale: 1 }}
        pressStyle={{ scale: 0.96 }}
        onPress={() => onPress(item.id)}
        p="$4"
        mb="$3"
        mx="$4"
    >
        <XStack ai="center" jc="space-between">
            <XStack ai="center" gap="$3">
                <YStack
                    w={32}
                    h={32}
                    ai="center"
                    jc="center"
                    bg={item.is_completed ? '$green4' : '$color4'}
                    br="$4"
                >
                    {item.is_completed ? (
                        <Check size={18} color="white" />
                    ) : (
                        <Text fontWeight="bold" color="white">
                            {item.order_index}
                        </Text>
                    )}
                </YStack>
                <Text fontSize="$5" fontWeight="600">
                    {item.title}
                </Text>
            </XStack>
            <ChevronRight size={20} color="$color10" />
        </XStack>
    </Card>
));

export default function LearnScreen() {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const loadData = useCallback(async () => {
        try {
            const [lessonsData, scenariosData] = await Promise.all([
                getLessons(),
                getScenarios()
            ]);
            setLessons(lessonsData as Lesson[]);
            setScenarios(scenariosData as Scenario[]);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Smart caching: only reload on first focus or when explicitly needed
    useFocusEffect(
        useCallback(() => {
            // Only load if data is empty (first time or after invalidation)
            if (lessons.length === 0 || scenarios.length === 0) {
                loadData();
            }
        }, [lessons.length, scenarios.length, loadData])
    );

    const handleScenarioPress = useCallback((id: number) => {
        router.push(`/scenario/${id}` as any);
    }, [router]);

    const handleLessonPress = useCallback((id: number) => {
        router.push(`/lesson/${id}`);
    }, [router]);

    const renderLessonItem = useCallback(({ item }: { item: Lesson }) => (
        <LessonCard item={item} onPress={handleLessonPress} />
    ), [handleLessonPress]);

    const headerComponent = useMemo(() => (
        <YStack>
            <Text fontSize="$8" fontWeight="bold" p="$4" pb="$2">
                Real-World Scenarios
            </Text>
            {/* Use ScrollView instead of FlashList for small horizontal lists */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
            >
                {scenarios.map((scenario) => (
                    <ScenarioCard
                        key={scenario.id}
                        item={scenario}
                        onPress={handleScenarioPress}
                    />
                ))}
            </ScrollView>
            <Text fontSize="$8" fontWeight="bold" p="$4" pt="$6">
                Grammar & Topics
            </Text>
        </YStack>
    ), [scenarios, handleScenarioPress]);

    if (isLoading) {
        return (
            <YStack f={1} ai="center" jc="center" bg="$background">
                <Spinner size="large" color="$color" />
            </YStack>
        );
    }

    return (
        <YStack f={1} bg="$background" pt={insets.top}>
            <FlashList
                data={lessons}
                renderItem={renderLessonItem}
                estimatedItemSize={72}
                keyExtractor={(item: Lesson) => item.id.toString()}
                ListHeaderComponent={headerComponent}
                contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            />
        </YStack>
    );
}

