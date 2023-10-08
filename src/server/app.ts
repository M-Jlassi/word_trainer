const express = require('express');
const path = require('path');

const { MongoClient } = require("mongodb");

// Replace the uri string with your MongoDB deployment's connection string.
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

import { words } from "./allWords";
import { readCsv, Word } from "./read_csv";
import WordQueue, { WordInMongo } from "./WordQueue";
import { WordsList, Result } from "./wordsList";

const update = true;
const app = express();
client.connect()
  .then(async () => {
    const database = client.db('word_trainer');

    if (!update)
      return;

    for (const [category, wordsInCategory] of Object.entries(words)) {
      const collection = database.collection(category);
      wordsInCategory.forEach(word => {
        (word as any).languageToGuess = "french";
        (word as any).knowledgeScore = 0;
      });
      const updateResult = [];
      for (const word of wordsInCategory) {
        updateResult.push(collection.updateOne({
          "german": word.german,
        }, {
          "$set": word
        }, {
          "upsert": true
        }));
      }

      Promise.all(updateResult).then(results => {
        console.log(`${results.filter(result => result.upsertedCount > 0).length} inserts and ${results.filter(result => result.modifiedCount > 0).length} updates realized on collection ${category}`)
      })
    }
  });

let wordsList: WordsList;
let wordQueue: WordQueue;

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/../client/word_trainer.html'));
});

app.get('/script.js', function (req, res) {
  res.sendFile(path.join(__dirname + '/../client/script.js'));
});

app.use((req, res, next) => {
  console.log('Requête reçue !');
  next();
});

app.use("/api/get-first-word", async (req, res, next) => {
  const category = "actions";
  // wordsList = new WordsList(category);
  wordQueue = new WordQueue(category);
  await wordQueue.initialize();

  // const firstWord = wordsList.currentWord;
  const firstWord = wordQueue.currentWord;
  res.status(200).json({ "firstWord": firstWord });
});

type UserValidation = "oui" | "presque" | "non";
export type ResultReceived = WordInMongo & { "result": UserValidation };

app.use("/api/register-result", async (req, res, next) => {
  const result: ResultReceived = req.query;
  wordQueue.processResult(result);

  const nextWord = wordQueue.currentWord;
  res.status(200).json({ "nextWord": nextWord });
});

app.use("/api/verify-traduction", async (req, res, next) => {
  const wordEnteredByUser = req.query.word;
  const {
    wordVerified,
    successPercentage,
    numberOfTraductionsVerified,
    traductionsHistory
  } = wordsList.verifyTraduction(wordEnteredByUser);

  let listIsFinished: boolean = false;
  let nextWord: undefined | string = wordsList.getNextWord().french;
  if (numberOfTraductionsVerified == -1) {
    listIsFinished = true;
    nextWord = undefined;
  }

  res.status(200).json(
    {
      "germanWordVerified": wordVerified.german,
      "frenchWordVerified": wordVerified.french,
      "successPercentage": successPercentage.toString() + "%",
      "wordEnteredByUser": wordEnteredByUser,
      "numberOfTraductionsVerified": numberOfTraductionsVerified,
      "nextWord": nextWord,
      "listIsFinished": listIsFinished,
      "traductionsHistory": traductionsHistory
    });
});

app.use("/api/get-results", async (req, res, next) => {
  const results: Result[] = wordsList.results;
  res.status(200).json({ "results": results });
});

app.use((req, res, next) => {
  res.status(201);
  next();
});

app.use((req, res, next) => {
  res.json({ message: 'Votre requête a bien été reçue !' });
  next();
});

app.use((req, res, next) => {
  console.log('Réponse envoyée avec succès !');
});

module.exports = app;