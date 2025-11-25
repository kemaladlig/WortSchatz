import { Word } from '@/types';
import React, { useEffect } from 'react';
import { Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Extrapolate,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { Card, Text, View, YStack } from 'tamagui';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface WordCardProps {
    word: Word;
    index: number;
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
}

export const WordCard = React.memo(function WordCard({ word, index, onSwipeLeft, onSwipeRight }: WordCardProps) {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);
    const rotate = useSharedValue(0);

    // Reset position when index changes (though usually component is unmounted)
    useEffect(() => {
        translateX.value = 0;
        translateY.value = 0;
        scale.value = 1;
        rotate.value = 0;
    }, [index]);

    const pan = Gesture.Pan()
        .onUpdate((event) => {
            translateX.value = event.translationX;
            translateY.value = event.translationY;
            rotate.value = interpolate(
                event.translationX,
                [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
                [-15, 0, 15],
                Extrapolate.CLAMP
            );
        })
        .onEnd((event) => {
            if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
                const direction = event.translationX > 0 ? 1 : -1;
                translateX.value = withTiming(direction * SCREEN_WIDTH * 1.5, {}, () => {
                    if (direction > 0) {
                        runOnJS(onSwipeRight)();
                    } else {
                        runOnJS(onSwipeLeft)();
                    }
                });
            } else {
                translateX.value = withSpring(0);
                translateY.value = withSpring(0);
                rotate.value = withSpring(0);
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { rotate: `${rotate.value}deg` },
            { scale: withSpring(index === 0 ? 1 : 0.95) }, // Slight scale effect for stacking
        ],
        zIndex: 100 - index, // Ensure correct stacking order visually
    }));

    const overlayStyleRight = useAnimatedStyle(() => ({
        opacity: interpolate(translateX.value, [0, SCREEN_WIDTH / 4], [0, 1]),
    }));

    const overlayStyleLeft = useAnimatedStyle(() => ({
        opacity: interpolate(translateX.value, [0, -SCREEN_WIDTH / 4], [0, 1]),
    }));

    return (
        <GestureDetector gesture={pan}>
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        width: '90%',
                        height: 400,
                        shadowColor: '#000',
                        shadowOffset: {
                            width: 0,
                            height: 2,
                        },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                        elevation: 5,
                    },
                    animatedStyle,
                ]}
            >
                <Card
                    f={1}
                    bordered
                    elevate
                    bg="$background"
                    p="$4"
                    ai="center"
                    jc="center"
                    animation="bouncy"
                >
                    {/* Swipe Feedback Overlays */}
                    <Animated.View
                        style={[
                            {
                                position: 'absolute',
                                top: 20,
                                left: 20,
                                zIndex: 10,
                                transform: [{ rotate: '-15deg' }],
                            },
                            overlayStyleRight,
                        ]}
                    >
                        <Card bordered p="$2" bg="$green4" borderColor="$green9">
                            <Text color="$green11" fontWeight="bold" fontSize="$6">
                                KNEW IT
                            </Text>
                        </Card>
                    </Animated.View>

                    <Animated.View
                        style={[
                            {
                                position: 'absolute',
                                top: 20,
                                right: 20,
                                zIndex: 10,
                                transform: [{ rotate: '15deg' }],
                            },
                            overlayStyleLeft,
                        ]}
                    >
                        <Card bordered p="$2" bg="$red4" borderColor="$red9">
                            <Text color="$red11" fontWeight="bold" fontSize="$6">
                                STUDY
                            </Text>
                        </Card>
                    </Animated.View>

                    <YStack ai="center" gap="$4">
                        <Text fontSize="$9" fontWeight="bold" textAlign="center">
                            {word.german_word}
                        </Text>

                        {/* Level Badge */}
                        <Card bordered px="$2" py="$1" bg="$blue3" borderColor="$blue5" br="$4">
                            <Text fontSize="$3" fontWeight="bold" color="$blue11">
                                {word.level || 'A1'}
                            </Text>
                        </Card>

                        <View h={1} w="50%" bg="$gray5" />

                        <YStack ai="center" gap="$2">
                            <Text fontSize="$5" color="$gray11" fontStyle="italic">
                                {word.article}
                            </Text>
                            <Text fontSize="$6" color="$color">
                                {word.translation}
                            </Text>
                        </YStack>

                        {word.example_sentence && (
                            <Card bg="$gray3" p="$3" mt="$4" br="$4">
                                <Text fontSize="$3" color="$gray11" textAlign="center">
                                    "{word.example_sentence}"
                                </Text>
                            </Card>
                        )}
                    </YStack>
                </Card>
            </Animated.View>
        </GestureDetector>
    );
});
