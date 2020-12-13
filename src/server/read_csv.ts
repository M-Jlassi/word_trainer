const csv = require('csv-parser');
const fs = require('fs');

interface Word {
  german: string;
  french: string;
}

function readCsv(): Promise<Word[]>
{
  const rawWords: string[] = [];
  
  return new Promise((resolve, reject) =>
  {
    fs.createReadStream('Allemand.csv',
                        {"encoding": "latin1"})
    .pipe(csv())
    .on('data', (row) => {
      const values: string[] = Object.values(row);
      const currentRowWord: string = values[0];
      rawWords.push(currentRowWord);
    })
    .on('end', () => {
      const words: Word[] = rawWords.map(createWordSeparatedByLanguage)
      resolve(words);
    });
  });
  
}

const createWordSeparatedByLanguage = rawWord =>
{
  const rawWordSplit: string[] = rawWord.split(";");
  const wordInBothLanguages: Word = { "german": rawWordSplit[0],
                                      "french": rawWordSplit[1] };
  return wordInBothLanguages;
}

export { readCsv, Word };