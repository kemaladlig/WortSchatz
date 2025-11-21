import { getLessons, getScenarios } from '@/db/repository';
import { Ambulance, Check, ChevronRight, Coffee, MessageCircle, User } from '@tamagui/lucide-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, ScrollView } from 'react-native';
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

export default function LearnScreen() {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const loadData = async () => {
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
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    if (isLoading) {
        return (
            <YStack f={1} ai="center" jc="center" bg="$background">
                <Spinner size="large" color="$color" />
            </YStack>
        );
    }

    return (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
            <YStack f={1} bg="$background" pt={insets.top}>
                {/* Scenarios Section */}
                <Text fontSize="$8" fontWeight="bold" p="$4" pb="$2">
                    Real-World Scenarios
                </Text>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={scenarios}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                    renderItem={({ item }) => {
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
                                onPress={() => router.push(`/scenario/${item.id}` as any)}
                                p="$4"
                                bg={item.color_theme as any}
                                jc="space-between"
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
                    }}
                />

                {/* Grammar Section */}
                <Text fontSize="$8" fontWeight="bold" p="$4" pt="$6">
                    Grammar & Topics
                </Text>
                <YStack px="$4" gap="$3">
                    {lessons.map((item) => (
                        <Card
                            key={item.id}
                            bordered
                            animation="bouncy"
                            scale={0.98}
                            hoverStyle={{ scale: 1 }}
                            pressStyle={{ scale: 0.96 }}
                            onPress={() => router.push(`/lesson/${item.id}`)}
                            p="$4"
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
                    ))}
                </YStack>
            </YStack>
        </ScrollView>
    );
}
