import { useAppStore } from '@/store/useAppStore';
import { Trophy } from '@tamagui/lucide-icons';
import { useEffect } from 'react';
import Animated, {
    useAnimatedProps,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';
import { Card, Text, XStack, YStack } from 'tamagui';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function DailyGoalHeader() {
    const { dailyWordGoal, wordsLearnedToday, checkAndResetDaily } = useAppStore();
    const progress = useSharedValue(0);

    useEffect(() => {
        checkAndResetDaily();
    }, []);

    useEffect(() => {
        const targetProgress = Math.min(wordsLearnedToday / dailyWordGoal, 1);
        progress.value = withSpring(targetProgress, {
            damping: 15,
            stiffness: 100,
        });
    }, [wordsLearnedToday, dailyWordGoal]);

    const radius = 35;
    const strokeWidth = 6;
    const circumference = 2 * Math.PI * radius;

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: circumference * (1 - progress.value),
    }));

    const isGoalMet = wordsLearnedToday >= dailyWordGoal;

    return (
        <Card
            elevate
            bordered
            bg="$background"
            p="$3"
            mx="$4"
            mb="$3"
        >
            <XStack ai="center" jc="space-between">
                <YStack gap="$1">
                    <Text fontSize="$2" color="$gray11" fontWeight="600">
                        Daily Goal
                    </Text>
                    <XStack ai="baseline" gap="$2">
                        <Text fontSize="$7" fontWeight="bold">
                            {wordsLearnedToday}
                        </Text>
                        <Text fontSize="$4" color="$gray10">
                            / {dailyWordGoal}
                        </Text>
                    </XStack>
                    {isGoalMet && (
                        <XStack ai="center" gap="$2">
                            <Trophy size={16} color="$yellow10" />
                            <Text fontSize="$3" color="$yellow10" fontWeight="bold">
                                Goal Met! 🎉
                            </Text>
                        </XStack>
                    )}
                </YStack>

                {/* Circular Progress */}
                <Svg width={80} height={80}>
                    {/* Background Circle */}
                    <Circle
                        cx={40}
                        cy={40}
                        r={radius}
                        stroke="#333"
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                    {/* Progress Circle */}
                    <AnimatedCircle
                        cx={40}
                        cy={40}
                        r={radius}
                        stroke={isGoalMet ? '#fbbf24' : '#3b82f6'}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference}
                        animatedProps={animatedProps}
                        strokeLinecap="round"
                        rotation="-90"
                        origin="40, 40"
                    />
                </Svg>
            </XStack>
        </Card>
    );
}
