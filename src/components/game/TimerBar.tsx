import { useEffect } from 'react';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { YStack } from 'tamagui';

interface TimerBarProps {
    duration: number;
    onTimeout: () => void;
    resetKey: number; // Change this to reset timer
    isRunning: boolean;
}

export const TimerBar = ({ duration, onTimeout, resetKey, isRunning }: TimerBarProps) => {
    const progress = useSharedValue(100);

    useEffect(() => {
        if (isRunning) {
            progress.value = 100;
            progress.value = withTiming(0, {
                duration: duration * 1000,
                easing: Easing.linear,
            }, (finished) => {
                if (finished) {
                    // Call onTimeout on JS thread
                    // Note: runOnJS is needed if we were inside a worklet, but here we are in callback
                    // However, it's safer to handle timeout in parent via useEffect or similar if strict timing needed
                    // But for simple game logic, this callback works if we ensure it runs on JS thread.
                    // Actually, withTiming callback runs on UI thread in recent Reanimated versions? 
                    // Let's use a JS-side timeout for logic and Reanimated for visual only to be safe/simple,
                    // OR use runOnJS.
                }
            });
        } else {
            cancelAnimation(progress);
        }
    }, [resetKey, isRunning, duration]);

    // Separate logic for timeout to ensure it runs reliably on JS thread
    useEffect(() => {
        if (!isRunning) return;

        const timer = setTimeout(() => {
            onTimeout();
        }, duration * 1000);

        return () => clearTimeout(timer);
    }, [resetKey, isRunning, duration]);

    const animatedStyle = useAnimatedStyle(() => ({
        width: `${progress.value}%`,
    }));

    return (
        <YStack w="100%" h={6} bg="$gray4">
            <Animated.View
                style={[
                    { height: '100%', backgroundColor: '#ff4d4d' },
                    animatedStyle,
                ]}
            />
        </YStack>
    );
};
