import { useAppStore } from '@/store/useAppStore';
import { Heart, Play, Trophy } from '@tamagui/lucide-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, H1, H3, Text, XStack, YStack } from 'tamagui';

export default function QuizLobby() {
    const { highScore, quizLives } = useAppStore();
    const insets = useSafeAreaInsets();
    const scale = useSharedValue(1);

    useEffect(() => {
        scale.value = withRepeat(
            withSpring(1.1, { damping: 2, stiffness: 100 }),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const startQuiz = () => {
        router.push('/quiz/game');
    };

    return (
        <YStack f={1} bg="$background" pt={insets.top} pb={insets.bottom} p="$4" gap="$6">
            {/* Header */}
            <YStack ai="center" gap="$2">
                <Trophy size={64} color="$yellow10" />
                <H1>Quiz Challenge</H1>
                <Text fontSize="$4" color="$gray11" textAlign="center">
                    Test your German vocabulary knowledge!
                </Text>
            </YStack>

            {/* Stats Board */}
            <XStack gap="$3" jc="center">
                <Card elevate size="$4" bordered bg="$background" p="$4" f={1} ai="center" gap="$2">
                    <Trophy size={32} color="$yellow10" />
                    <Text fontSize="$2" color="$gray11">High Score</Text>
                    <H3>{highScore}</H3>
                </Card>
                <Card elevate size="$4" bordered bg="$background" p="$4" f={1} ai="center" gap="$2">
                    <Heart size={32} fill="#ff4d4d" color="#ff4d4d" />
                    <Text fontSize="$2" color="$gray11">Lives</Text>
                    <H3>{quizLives}</H3>
                </Card>
            </XStack>

            {/* Start Button */}
            <YStack f={1} jc="center" ai="center" overflow="visible">
                <Animated.View style={animatedStyle}>
                    <Button
                        size="$6"
                        theme="blue"
                        icon={Play}
                        onPress={startQuiz}
                        w={150}
                        h={150}
                        fontSize="$6"
                        fontWeight="bold"
                        borderRadius="$12"
                    >
                        START
                    </Button>
                </Animated.View>
            </YStack>

            {/* Instructions */}
            <Card bordered bg="$background" p="$4" gap="$2">
                <Text fontSize="$5" fontWeight="bold">How to Play:</Text>
                <Text fontSize="$3" color="$gray11">• Answer questions correctly to earn points</Text>
                <Text fontSize="$3" color="$gray11">• Each correct answer increases your combo</Text>
                <Text fontSize="$3" color="$gray11">• You have 15 seconds per question</Text>
                <Text fontSize="$3" color="$gray11">• Lose a life for wrong answers or timeouts</Text>
                <Text fontSize="$3" color="$gray11">• Game over when you lose all 3 lives</Text>
            </Card>
        </YStack>
    );
}
