import { getLessonById, markLessonComplete } from '@/db/repository';
import { CheckCircle } from '@tamagui/lucide-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, useColorScheme } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Spinner, YStack } from 'tamagui';

interface Lesson {
    id: number;
    title: string;
    content: string;
    is_completed: number;
}

export default function LessonDetailScreen() {
    const { id } = useLocalSearchParams();
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const colorScheme = useColorScheme();

    useEffect(() => {
        const fetchLesson = async () => {
            if (id) {
                const data = await getLessonById(Number(id));
                setLesson(data as Lesson);
                setIsLoading(false);
            }
        };
        fetchLesson();
    }, [id]);

    const handleComplete = async () => {
        if (lesson) {
            await markLessonComplete(lesson.id);
            router.back();
        }
    };

    if (isLoading || !lesson) {
        return (
            <YStack f={1} ai="center" jc="center" bg="$background">
                <Spinner size="large" color="$color" />
            </YStack>
        );
    }

    const markdownStyles = {
        body: {
            color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
            fontSize: 16,
            lineHeight: 24,
        },
        heading1: {
            color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
            fontSize: 28,
            fontWeight: 'bold',
            marginBottom: 16,
        },
        heading3: {
            color: colorScheme === 'dark' ? '#E0E0E0' : '#333333',
            fontSize: 20,
            fontWeight: 'bold',
            marginTop: 16,
            marginBottom: 8,
        },
        strong: {
            fontWeight: 'bold',
            color: colorScheme === 'dark' ? '#60a5fa' : '#2563eb', // Blue highlight
        },
    };

    return (
        <YStack f={1} bg="$background">
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                <Markdown style={markdownStyles as any}>
                    {lesson.content}
                </Markdown>
            </ScrollView>

            <YStack
                pos="absolute"
                bottom={0}
                left={0}
                right={0}
                p="$4"
                pb={insets.bottom + 10}
                bg="$background"
                borderTopWidth={1}
                borderColor="$borderColor"
            >
                <Button
                    size="$5"
                    theme="green"
                    icon={CheckCircle}
                    onPress={handleComplete}
                >
                    Mark as Read
                </Button>
            </YStack>
        </YStack>
    );
}
