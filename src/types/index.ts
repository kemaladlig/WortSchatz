export type ArticleType = 'der' | 'die' | 'das';

export interface Word {
    id: number;
    german_word: string;
    article: ArticleType;
    translation: string;
    example_sentence: string;
    mastery_level: number; // 0-5
    level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
    last_reviewed: string | null; // ISO Date string
    easiness_factor: number;
    interval: number;
    repetitions: number;
    next_review_date: string | null;
}
