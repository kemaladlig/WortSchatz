import { getDB } from '@/db/client';
import { getWords, updateMastery } from '@/db/repository';
import { useAppStore } from '@/store/useAppStore';
import { Word } from '@/types';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export function useDeck() {
    const [words, setWords] = useState<Word[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { incrementDailyProgress, checkAndResetDaily } = useAppStore();

    // Queue for pending updates: { wordId, newLevel }
    const pendingUpdates = useRef<{ wordId: number; newLevel: number }[]>([]);
    const appState = useRef(AppState.currentState);

    const isFetching = useRef(false);

    const loadMore = useCallback(async (currentWords: Word[]) => {
        if (isFetching.current) return;
        isFetching.current = true;

        try {
            const currentIds = currentWords.map(w => w.id);
            const newWords = await getWords(10, currentIds);

            if (newWords.length > 0) {
                setWords(prev => {
                    // Filter out any duplicates that might have sneaked in (though excludeIds should prevent this)
                    const existingIds = new Set(prev.map(w => w.id));
                    const uniqueNewWords = newWords.filter(w => !existingIds.has(w.id));
                    return [...prev, ...uniqueNewWords];
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
            isFetching.current = false;
        }
    }, []);

    // Flush pending updates to the database in a batch transaction
    const flushUpdates = useCallback(async () => {
        if (pendingUpdates.current.length === 0) return;

        const updatesToProcess = [...pendingUpdates.current];
        pendingUpdates.current = []; // Clear queue immediately

        try {
            const db = await getDB();
            await db.withTransactionAsync(async () => {
                for (const update of updatesToProcess) {
                    await updateMastery(update.wordId, update.newLevel);
                }
            });
            console.log(`Flushed ${updatesToProcess.length} updates`);
        } catch (e) {
            console.error("Failed to flush updates:", e);
            // Re-queue failed updates (optional, but safer)
            pendingUpdates.current = [...updatesToProcess, ...pendingUpdates.current];
        }
    }, []);

    useEffect(() => {
        checkAndResetDaily();
        loadMore([]);

        // Flush on unmount
        return () => {
            flushUpdates();
        };
    }, [loadMore, flushUpdates]);

    // Flush when app goes to background
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (
                appState.current === 'active' &&
                nextAppState.match(/inactive|background/)
            ) {
                flushUpdates();
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [flushUpdates]);

    const handleSwipeLeft = useCallback(async (wordId: number) => {
        // Still Learning: Reset mastery to 0
        pendingUpdates.current.push({ wordId, newLevel: 0 });

        // Remove current word
        setWords((prev) => {
            const newWords = prev.slice(1);

            // Fetch new words if running low
            if (newWords.length <= 3) {
                loadMore(newWords);
            }

            return newWords;
        });
    }, [loadMore]);

    const handleSwipeRight = useCallback(async (wordId: number, currentLevel: number) => {
        // Got it: Increment mastery
        const newLevel = Math.min(currentLevel + 1, 5);
        pendingUpdates.current.push({ wordId, newLevel });

        // Haptic feedback and daily progress
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        incrementDailyProgress();

        // Remove current word
        setWords((prev) => {
            const newWords = prev.slice(1);

            // Fetch new words if running low
            if (newWords.length <= 3) {
                loadMore(newWords);
            }

            return newWords;
        });
    }, [incrementDailyProgress, loadMore]);

    return {
        words,
        isLoading,
        handleSwipeLeft,
        handleSwipeRight,
        refresh: () => {
            setWords([]);
            setIsLoading(true);
            loadMore([]);
        },
    };
}
