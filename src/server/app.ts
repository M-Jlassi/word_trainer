const express = require('express');
const path = require('path');

const { MongoClient } = require("mongodb");

// Replace the uri string with your MongoDB deployment's connection string.
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

import { readCsv, Word } from "./read_csv";
import { WordsList, Result } from "./wordsList";

const app = express();
// readCsv()
//   .then(async words => {
//     await client.connect();

//     const database = client.db('word_trainer');
//     const wordsCollection = database.collection('words');

//     const result = await wordsCollection.insertMany(words);
//     console.log(`${result.insertedCount} documents were inserted`);
//   });

let wordsList: WordsList;

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
  const words: Word[] = await readCsv();
  wordsList = new WordsList(words);
  const firstWord: Word = wordsList.currentWord;
  res.status(200).json({ "firstWord": firstWord.french });
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