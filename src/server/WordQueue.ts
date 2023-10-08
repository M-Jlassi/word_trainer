import { Db, MongoClient, ObjectId } from "mongodb";
import { ResultReceived } from "./app";
import { Word } from "./read_csv";

export type WordInMongo = Word & {
    "_id": string;
    languageToGuess: "german" | "french";
    knowledgeScore: number;
}

export default class WordQueue {
    words: WordInMongo[];
    category: string;
    currentWord: WordInMongo;
    database: Db;

    constructor(category: string) {
        this.category = category;
    }

    async initialize() {
        const uri = "mongodb://localhost:27017";
        const client = new MongoClient(uri);
        await client.connect();

        const database = client.db('word_trainer');
        this.database = database;

        const collection = database.collection(this.category);
        const cursor = collection.find({});

        const words = await cursor.toArray()

        shuffleArray(words);
        this.words = (words as any).sort((word1, word2) =>
            (word1.knowledgeScore - word2.knowledgeScore));
        this.currentWord = this.getCurrentWord();
    }

    getCurrentWord() {
        const word = this.words.shift();
        return word;
    }

    processResult(resultReceived: ResultReceived) {
        const result = resultReceived.result;
        let knowledgeScore = 0;
        let queuePercentage = 0;

        switch (result) {
            case "oui":
                knowledgeScore = 1;
                queuePercentage = 100;
                break;
            case "presque":
                knowledgeScore = 0.5;
                queuePercentage = 50;
                break;
            case "non":
                knowledgeScore = 0;
                queuePercentage = 10;
                break;
        }
        this.placeCurrentWordAtPercentage(knowledgeScore, queuePercentage);
        this.currentWord = this.getCurrentWord();

        const collection = this.database.collection(this.category);
        const objectId = new ObjectId(resultReceived._id);
        collection.updateOne({ "_id": objectId }, {
            "$inc": {
                "knowledgeScore": knowledgeScore
            }
        });
    }

    placeCurrentWordAtPercentage(knowledgeScore: number, queuePercentage: number) {
        this.currentWord = this.flipCurrentWordLanguage();
        this.currentWord.knowledgeScore += knowledgeScore;

        if (queuePercentage === 100) {
            this.words.push(this.currentWord);
            return;
        }

        const indexToInsert = Math.ceil((this.words.length + 1) * (queuePercentage / 100));
        this.words.splice(indexToInsert, 0, this.currentWord);
    }

    flipCurrentWordLanguage() {
        let newLanguage: "french" | "german" = "french";
        if (this.currentWord.languageToGuess === "french")
            newLanguage = "german";

        if (this.currentWord.languageToGuess === "german")
            newLanguage = "french";

        this.currentWord.languageToGuess = newLanguage;
        return this.currentWord;
    }
}

// From https://stackoverflow.com/a/12646864
/* Randomize array in-place using Durstenfeld shuffle algorithm */

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}