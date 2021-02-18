import { getEditDistance } from "./levenshtein";
import { Word } from "./read_csv";

interface Result
{
    word: Word;
    traduction: string;
    traductionIsCorrect: boolean;
};

class WordsList
{
    totalNumberOfWords: number;
    remainingWords: Word[];
    currentWord: Word;
    results: Result[];

    constructor(words: Word[])
    {
        this.totalNumberOfWords = words.length;
        this.remainingWords = words;
        this.currentWord = this.getNextWord();
        this.results = [];
    }

    verifyTraduction(traduction: string): { "numberOfTraductionsVerified": number,
                                            "wordVerified": Word,
                                            "successPercentage": number }
    {
        const remainingWords: Word[] = this.remainingWords;
        if (remainingWords.length == 0)
            return {
                "wordVerified": this.currentWord,
                "successPercentage": -1,
                "numberOfTraductionsVerified": -1
            };
        const indexToVerify: number = remainingWords.findIndex(word =>
        {
            return word.french == this.currentWord.french;
        });
        const wordToVerify: Word = remainingWords[indexToVerify];
        let traductionIsCorrect: boolean = false;

        const editDistance = getEditDistance(traduction, wordToVerify.german);
        const successPercentage = calculateSuccessPercentage(editDistance,
                                                             wordToVerify.german.length);

        if (wordToVerify.german.includes(traduction))
            traductionIsCorrect = true;
        this.results.push(
        {
            "word": wordToVerify,
            "traduction": traduction,
            "traductionIsCorrect": traductionIsCorrect
        });
        remainingWords.splice(indexToVerify, 1);

        const numberOfTraductionsVerified: number = this.totalNumberOfWords - remainingWords.length;

        return {
            "wordVerified": this.currentWord,
            "successPercentage": successPercentage,
            "numberOfTraductionsVerified": numberOfTraductionsVerified
        }
    }

    getNextWord(): Word
    {
        const remainingWords = this.remainingWords;
        if (remainingWords.length == 0)
            return {"german": "", "french": ""};

        const nextWordIndex: number = getRandomInt(remainingWords.length);
        const nextWord: Word = remainingWords[nextWordIndex];
        this.currentWord = nextWord;
        return nextWord;
    }
}

function getRandomInt(max: number): number {
    return Math.floor(Math.random() * Math.floor(max));
}

function calculateSuccessPercentage(editDistance: number, wordLength: number)
{
    const failureRatio = editDistance / wordLength;
    if (failureRatio > 1)
        return 0;
    
    const successRatio = (failureRatio - 1) * (-1);
    const successPercentage = successRatio * 100;

    return Math.round(successPercentage);
}
export { WordsList, Result };