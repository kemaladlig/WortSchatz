export function getCleanWord(word: string, article: string): string {
    if (!word || !article) return word;

    const lowerWord = word.toLowerCase();
    const lowerArticle = article.toLowerCase();

    if (lowerWord.startsWith(lowerArticle + ' ')) {
        const cleaned = word.substring(article.length).trim();
        // Ensure first letter is capitalized (German nouns)
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    return word;
}
