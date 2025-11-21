import { useAppStore } from '@/store/useAppStore';
import { Flame, Heart } from '@tamagui/lucide-icons';
import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { Text, XStack } from 'tamagui';

export const GameHeader = () => {
    const { quizLives, comboMultiplier, score } = useAppStore();
    const comboScale = useSharedValue(1);

    useEffect(() => {
        if (comboMultiplier > 1) {
            comboScale.value = withSequence(
                withSpring(1.5),
                withSpring(1)
            );
        }
    }, [comboMultiplier]);

    const animatedComboStyle = useAnimatedStyle(() => ({
        transform: [{ scale: comboScale.value }],
    }));

    return (
        <XStack w="100%" jc="space-between" ai="center" px="$4" py="$2" bg="$background">
            {/* Lives */}
            <XStack gap="$1">
                {[1, 2, 3].map((i) => (
                    <Heart
                        key={i}
                        size={24}
                        fill={i <= quizLives ? '#ff4d4d' : 'transparent'}
                        color={i <= quizLives ? '#ff4d4d' : '$gray8'}
                    />
                ))}
            </XStack>

            {/* Score */}
            <Text fontSize="$6" fontWeight="bold" color="$color">
                {score} pts
            </Text>

            {/* Combo */}
            <Animated.View style={animatedComboStyle}>
                <XStack ai="center" gap="$1">
                    <Flame
                        size={24}
                        fill={comboMultiplier > 1 ? '#ff9f43' : 'transparent'}
                        color={comboMultiplier > 1 ? '#ff9f43' : '$gray8'}
                    />
                    <Text fontSize="$5" fontWeight="bold" color={comboMultiplier > 1 ? '#ff9f43' : '$gray8'}>
                        x{comboMultiplier}
                    </Text>
                </XStack>
            </Animated.View>
        </XStack>
    );
};
