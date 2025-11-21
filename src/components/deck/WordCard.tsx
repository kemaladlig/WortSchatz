import { ArticleColors } from '@/constants/Colors';
import { Word } from '@/types';
import { Check, RotateCcw } from '@tamagui/lucide-icons';
import * as Speech from 'expo-speech';
import { Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { Card, Text, XStack, YStack } from 'tamagui';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface WordCardProps {
    word: Word;
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
    index: number; // 0 is top card
}

export function WordCard({ word, onSwipeLeft, onSwipeRight, index }: WordCardProps) {
    const translateX = useSharedValue(0);
    const rotate = useSharedValue(0);

    // Only enable gestures for the top card
    const isTopCard = index === 0;

    const speak = () => {
        Speech.speak(word.german_word, { language: 'de' });
    };

    const pan = Gesture.Pan()
        .enabled(isTopCard)
        .onUpdate((event) => {
            translateX.value = event.translationX;
            rotate.value = interpolate(
                event.translationX,
                [-SCREEN_WIDTH / 2, SCREEN_WIDTH / 2],
                [-15, 15],
                Extrapolation.CLAMP
            );
        })
        .onEnd((event) => {
            if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
                const direction = event.translationX > 0 ? 'right' : 'left';
                translateX.value = withSpring(
                    direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100,
                    {},
                    () => {
                        if (direction === 'right') runOnJS(onSwipeRight)();
                        else runOnJS(onSwipeLeft)();
                    }
                );
            } else {
                translateX.value = withSpring(0);
                rotate.value = withSpring(0);
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { rotate: `${rotate.value}deg` },
            { scale: withSpring(index === 0 ? 1 : 0.95) }, // Scale down background cards
            { translateY: withSpring(index === 0 ? 0 : 10 * index) } // Stack effect
        ],
        zIndex: 100 - index,
        opacity: withSpring(index < 3 ? 1 : 0), // Hide cards deep in stack
    }));

    const gotItStyle = useAnimatedStyle(() => ({
        opacity: interpolate(translateX.value, [0, 100], [0, 1]),
    }));

    const learningStyle = useAnimatedStyle(() => ({
        opacity: interpolate(translateX.value, [-100, 0], [1, 0]),
    }));

    const articleColor = ArticleColors[word.article] || '#888';

    // Determine level badge based on mastery_level
    const getLevelBadge = () => {
        if (word.mastery_level <= 1) return 'A1';
        if (word.mastery_level <= 3) return 'A2';
        return 'B1';
    };

    return (
        <GestureDetector gesture={pan}>
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        width: SCREEN_WIDTH - 40,
                        height: 500,
                        alignSelf: 'center',
                    },
                    animatedStyle,
                ]}
            >
                <Card
                    elevate
                    size="$5"
                    bordered
                    animation="bouncy"
                    scale={0.9}
                    hoverStyle={{ scale: 0.925 }}
                    pressStyle={{ scale: 0.875 }}
                    onPress={speak}
                    backgroundColor="$background"
                    f={1}
                    jc="center"
                    ai="center"
                    p="$4"
                >
                    <YStack f={1} jc="space-between" py="$4">
                        <YStack ai="center" gap="$4" f={1} jc="center">
                            <XStack gap="$2" ai="center">
                                <Text
                                    color={articleColor}
                                    fontWeight="bold"
                                    fontSize="$8"
                                >
                                    {word.article}
                                </Text>
                                <Text fontSize="$9" fontWeight="bold">
                                    {word.german_word}
                                </Text>
                            </XStack>

                            <Text fontSize="$5" color="$color" opacity={0.7}>
                                {word.translation}
                            </Text>

                            <Text
                                fontSize="$4"
                                color="$color"
                                opacity={0.5}
                                textAlign="center"
                                mt="$4"
                            >
                                {word.example_sentence}
                            </Text>
                        </YStack>

                        {/* Metadata Badges */}
                        <XStack jc="center" gap="$2" pb="$2">
                            <YStack bg="$blue9" px="$3" py="$1.5" borderRadius="$10">
                                <Text fontSize="$2" color="white" fontWeight="600">
                                    Level: {getLevelBadge()}
                                </Text>
                            </YStack>
                            <YStack bg="$purple9" px="$3" py="$1.5" borderRadius="$10">
                                <Text fontSize="$2" color="white" fontWeight="600">
                                    Streak: {word.mastery_level}
                                </Text>
                            </YStack>
                        </XStack>
                    </YStack>

                    {/* Icon Overlay for Swipe Feedback */}
                    <Animated.View style={[{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: [{ translateX: -50 }, { translateY: -50 }],
                        alignItems: 'center',
                        justifyContent: 'center',
                    }, gotItStyle]}>
                        <Check size={120} color="#22c55e" strokeWidth={3} />
                    </Animated.View>

                    <Animated.View style={[{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: [{ translateX: -50 }, { translateY: -50 }],
                        alignItems: 'center',
                        justifyContent: 'center',
                    }, learningStyle]}>
                        <RotateCcw size={120} color="#ef4444" strokeWidth={3} />
                    </Animated.View>

                </Card>
            </Animated.View>
        </GestureDetector>
    );
}
