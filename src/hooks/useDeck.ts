import { getWords, updateMastery } from '@/db/repository';
import { useAppStore } from '@/store/useAppStore';
import { Word } from '@/types';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';

export function useDeck() {
    const [words, setWords] = useState<Word[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { incrementDailyProgress, checkAndResetDaily } = useAppStore();

    const fetchWords = useCallback(async () => {
        setIsLoading(true);
        try {
            const newWords = await getWords(10);
            setWords(newWords);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAndResetDaily();
        fetchWords();
    }, [fetchWords]);

    const handleSwipeLeft = useCallback(async (wordId: number) => {
        // Still Learning: Reset mastery to 0 (or keep it 0)
        await updateMastery(wordId, 0);
        setWords((prev) => prev.slice(1));
        if (words.length <= 2) fetchWords(); // Pre-fetch when running low
    }, [words.length, fetchWords]);

    const handleSwipeRight = useCallback(async (wordId: number, currentLevel: number) => {
        // Got it: Increment mastery
        const newLevel = Math.min(currentLevel + 1, 5);
        await updateMastery(wordId, newLevel);

        // Haptic feedback and daily progress
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        incrementDailyProgress();

        setWords((prev) => prev.slice(1));
        if (words.length <= 2) fetchWords();
    }, [words.length, fetchWords, incrementDailyProgress]);

    return {
        words,
        isLoading,
        handleSwipeLeft,
        handleSwipeRight,
        refresh: fetchWords,
    };
}
