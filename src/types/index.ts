export type ArticleType = 'der' | 'die' | 'das';

export interface Word {
    id: number;
    german_word: string;
    article: ArticleType;
    translation: string;
    example_sentence: string;
    mastery_level: number; // 0-5
    last_reviewed: string | null; // ISO Date string
}
