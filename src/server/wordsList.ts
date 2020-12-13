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

    verifyTraduction(traduction: string): number
    {
        const remainingWords: Word[] = this.remainingWords;
        if (remainingWords.length == 0)
            return -1;

        const indexToVerify: number = remainingWords.findIndex(word =>
        {
            return word.german == this.currentWord.german;
        });
        const wordToVerify: Word = remainingWords[indexToVerify];
        let traductionIsCorrect: boolean = false;
        if (wordToVerify.french.includes(traduction))
            traductionIsCorrect = true;
        this.results.push(
        {
            "word": wordToVerify,
            "traduction": traduction,
            "traductionIsCorrect": traductionIsCorrect
        });
        remainingWords.splice(indexToVerify, 1);
        const numberOfTraductionsVerified: number = this.totalNumberOfWords - remainingWords.length;
        return numberOfTraductionsVerified;
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


export { WordsList, Result };