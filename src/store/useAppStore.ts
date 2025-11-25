import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AppState {
    quizLives: number;
    comboMultiplier: number;
    score: number;
    highScore: number;

    // Daily Goal Tracking
    dailyWordGoal: number;
    wordsLearnedToday: number;
    lastResetDate: string;

    // Actions
    resetGame: () => void;
    decrementLives: () => void;
    incrementCombo: () => void;
    resetCombo: () => void;
    addScore: (points: number) => void;
    updateHighScore: () => void;

    // Daily Goal Actions
    incrementDailyProgress: () => void;
    checkAndResetDaily: () => void;
    setDailyGoal: (goal: number) => void;
    resetDailyProgress: () => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            quizLives: 3,
            comboMultiplier: 1,
            score: 0,
            highScore: 0,

            // Daily Goal State
            dailyWordGoal: 20,
            wordsLearnedToday: 0,
            lastResetDate: new Date().toDateString(),

            resetGame: () => set({ quizLives: 3, comboMultiplier: 1, score: 0 }),

            decrementLives: () => set((state) => ({ quizLives: Math.max(0, state.quizLives - 1) })),

            incrementCombo: () => set((state) => ({ comboMultiplier: state.comboMultiplier + 1 })),

            resetCombo: () => set({ comboMultiplier: 1 }),

            addScore: (points) => set((state) => ({ score: state.score + points })),

            updateHighScore: () => {
                const { score, highScore } = get();
                if (score > highScore) {
                    set({ highScore: score });
                }
            },

            // Daily Goal Actions
            incrementDailyProgress: () => {
                const state = get();
                state.checkAndResetDaily();
                set((state) => ({ wordsLearnedToday: state.wordsLearnedToday + 1 }));
            },

            checkAndResetDaily: () => {
                const today = new Date().toDateString();
                const { lastResetDate } = get();

                if (lastResetDate !== today) {
                    set({
                        wordsLearnedToday: 0,
                        lastResetDate: today
                    });
                }
            },

            setDailyGoal: (goal: number) => set({ dailyWordGoal: goal }),

            resetDailyProgress: () => set({ wordsLearnedToday: 0 }),
        }),
        {
            name: 'app-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                highScore: state.highScore,
                dailyWordGoal: state.dailyWordGoal,
                wordsLearnedToday: state.wordsLearnedToday,
                lastResetDate: state.lastResetDate,
            }),
        }
    )
);
