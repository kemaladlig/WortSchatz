import { GameHeader } from '@/components/game/GameHeader';
import { TimerBar } from '@/components/game/TimerBar';
import { getWords } from '@/db/repository';
import { useAppStore } from '@/store/useAppStore';
import { Word } from '@/types';
import { Check, RotateCcw, Trophy, X } from '@tamagui/lucide-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Spinner, Text, View, XStack, YStack } from 'tamagui';

export default function QuizGame() {
    const {
        quizLives,
        resetGame,
        decrementLives,
        incrementCombo,
        resetCombo,
        addScore,
        comboMultiplier,
        updateHighScore,
        highScore,
        score
    } = useAppStore();

    const insets = useSafeAreaInsets();
    const [words, setWords] = useState<Word[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timerKey, setTimerKey] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isVictory, setIsVictory] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [options, setOptions] = useState<string[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [correctAnswer, setCorrectAnswer] = useState<string>('');

    useEffect(() => {
        loadQuiz();
    }, []);

    useEffect(() => {
        if (quizLives <= 0 && !isGameOver) {
            setIsGameOver(true);
            updateHighScore();
        }
    }, [quizLives]);

    const loadQuiz = async () => {
        resetGame();
        setIsLoading(true);
        setIsGameOver(false);
        setIsVictory(false);

        const quizWords = await getWords(10);
        setWords(quizWords);
        setCurrentIndex(0);

        if (quizWords.length > 0) {
            generateOptions(quizWords[0], quizWords);
        }

        setIsLoading(false);
    };

    const generateOptions = (currentWord: Word, allWords: Word[]) => {
        const correct = currentWord.translation;
        setCorrectAnswer(correct);
        setSelectedAnswer(null);

        const wrongAnswers = allWords
            .filter(w => w.id !== currentWord.id)
            .map(w => w.translation)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        const allOptions = [correct, ...wrongAnswers].sort(() => Math.random() - 0.5);
        setOptions(allOptions);
    };

    const handleAnswer = async (answer: string) => {
        if (selectedAnswer) return;

        setSelectedAnswer(answer);
        const currentWord = words[currentIndex];
        const isCorrect = answer === currentWord.translation;

        if (isCorrect) {
            const points = 10 * comboMultiplier;
            addScore(points);
            incrementCombo();
        } else {
            resetCombo();
            decrementLives();
        }

        await new Promise(resolve => setTimeout(resolve, 800));

        const nextIndex = currentIndex + 1;
        if (nextIndex < words.length) {
            setCurrentIndex(nextIndex);
            generateOptions(words[nextIndex], words);
            setTimerKey(prev => prev + 1);
        } else {
            if (quizLives > 0) {
                setIsVictory(true);
                updateHighScore();
            }
        }
    };

    const onTimeout = () => {
        if (isGameOver || isVictory) return;
        resetCombo();
        decrementLives();

        const nextIndex = currentIndex + 1;
        if (nextIndex < words.length) {
            setCurrentIndex(nextIndex);
            generateOptions(words[nextIndex], words);
            setTimerKey(prev => prev + 1);
        }
    };

    const handleExit = () => {
        router.back();
    };

    const getButtonTheme = (option: string) => {
        if (!selectedAnswer) return 'blue';
        if (option === correctAnswer) return 'green';
        if (option === selectedAnswer && option !== correctAnswer) return 'red';
        return 'gray';
    };

    const getButtonIcon = (option: string) => {
        if (!selectedAnswer) return undefined;
        if (option === correctAnswer) return Check;
        if (option === selectedAnswer && option !== correctAnswer) return X;
        return undefined;
    };

    if (isLoading) {
        return (
            <YStack f={1} ai="center" jc="center" bg="$background">
                <Spinner size="large" color="$color" />
            </YStack>
        );
    }

    if (words.length === 0) {
        return (
            <YStack f={1} ai="center" jc="center" bg="$background" p="$4" gap="$4">
                <Text fontSize="$6">No words available for quiz</Text>
                <Button onPress={handleExit}>Go Back</Button>
            </YStack>
        );
    }

    const currentWord = words[currentIndex];

    return (
        <YStack f={1} bg="$background" pb={insets.bottom}>
            <YStack pt={insets.top}>
                <GameHeader />
                <TimerBar
                    duration={15}
                    onTimeout={onTimeout}
                    resetKey={timerKey}
                    isRunning={!isGameOver && !isVictory && !selectedAnswer}
                />
            </YStack>

            <YStack f={1} p="$4" gap="$6" jc="center">
                <Card elevate bordered bg="$background" p="$6" ai="center" gap="$3">
                    <Text fontSize="$3" color="$gray11">Translate to English:</Text>
                    <Text fontSize="$10" fontWeight="bold">{currentWord?.german_word}</Text>
                    <Text fontSize="$2" color="$gray10">Question {currentIndex + 1} of {words.length}</Text>
                </Card>

                <YStack gap="$3">
                    {options.map((option, index) => (
                        <Button
                            key={index}
                            size="$5"
                            onPress={() => handleAnswer(option)}
                            theme={getButtonTheme(option)}
                            icon={getButtonIcon(option)}
                            disabled={selectedAnswer !== null}
                        >
                            {option}
                        </Button>
                    ))}
                </YStack>
            </YStack>

            <Modal visible={isGameOver} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <Card elevate size="$4" bordered bg="$background" p="$6" w="85%" maxWidth={400} gap="$4" ai="center">
                        <Text fontSize="$8" fontWeight="bold" color="$red10">Game Over</Text>
                        <Text fontSize="$5">Final Score: {score}</Text>
                        <Text fontSize="$4">High Score: {highScore}</Text>
                        <XStack gap="$3" w="100%">
                            <Button size="$4" theme="gray" icon={RotateCcw} onPress={handleExit} f={1} fontSize="$4">
                                Exit
                            </Button>
                            <Button size="$4" theme="red" onPress={loadQuiz} f={1} fontSize="$4">
                                Retry
                            </Button>
                        </XStack>
                    </Card>
                </View>
            </Modal>

            <Modal visible={isVictory} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <Card elevate size="$4" bordered bg="$background" p="$6" w="85%" maxWidth={400} gap="$4" ai="center">
                        <Trophy size={64} color="$yellow10" />
                        <Text fontSize="$8" fontWeight="bold" color="$yellow10">Perfect!</Text>
                        <Text fontSize="$5">Final Score: {score}</Text>
                        <Text fontSize="$4">Lives Left: {quizLives}</Text>
                        <XStack gap="$3" w="100%">
                            <Button size="$4" theme="gray" icon={RotateCcw} onPress={handleExit} f={1} fontSize="$4">
                                Exit
                            </Button>
                            <Button size="$4" theme="green" onPress={loadQuiz} f={1} fontSize="$4">
                                Play Again
                            </Button>
                        </XStack>
                    </Card>
                </View>
            </Modal>
        </YStack>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
});
