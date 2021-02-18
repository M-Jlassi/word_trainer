async function getFirstWord()
{
  const response = await fetch('api/get-first-word');
  return response.json();
}

function displayNextWord(nextWord = undefined)
{
  if (nextWord != undefined)
    document.getElementById("word-to-find").textContent = nextWord;
  else
  {
    getFirstWord().then(responseJSON =>
    {
      document.getElementById("word-to-find").textContent = responseJSON.firstWord;
    });
  }
}

function verifyWordIfKeyIsEnter(event)
{
  if (event.key == "Enter")
  {
    const wordToVerify = event.target.value;
    fetch("/api/verify-traduction?word=" + encodeURIComponent(wordToVerify))
      .then(response => response.json())
      .then(responseJSON =>
      {
        updateNumberOfTraductionsVerified(responseJSON.numberOfTraductionsVerified);
        displayTraductionResult(responseJSON);
        displayNextWord(responseJSON.nextWord);
        if (responseJSON.listIsFinished)
          displayFinalResults();
      });
  }
}

function updateNumberOfTraductionsVerified(numberOfTraductionsVerified)
{
  document.getElementById("number-of-words-verified").textContent = numberOfTraductionsVerified;
}

function displayTraductionResult(responseJSON)
{
  const wrapper = document.createElement("div");

  const successPercentage = document.createElement("span");
  successPercentage.textContent = responseJSON.successPercentage;
  wrapper.appendChild(successPercentage);

  const wordEnteredByUser = document.createElement("span");
  wordEnteredByUser.textContent = responseJSON.wordEnteredByUser;
  wrapper.appendChild(wordEnteredByUser);

  const germanWordVerified = document.createElement("span");
  germanWordVerified.classList.add("span--bold")
  germanWordVerified.textContent = responseJSON.germanWordVerified; 
  wrapper.appendChild(germanWordVerified);

  const frenchWordVerified = document.createElement("span");
  frenchWordVerified.textContent = responseJSON.frenchWordVerified; 
  wrapper.appendChild(frenchWordVerified);

  const results = document.getElementById("results");
  if (results.children.length == 0)
    results.appendChild(wrapper);
  else
  {
    const firstChildren = results.children[0];
    results.insertBefore(wrapper, firstChildren);
  }
}

function displayFinalResults()
{
  fetch("/api/get-results")
    .then(response => response.json())
    .then(createFinalResultsHTML)
}

function createFinalResultsHTML(responseJSON)
{
  const wrapper = document.createElement("div");
  for (const result of responseJSON.results)
  {    
    const word = document.createElement("div");

    const german = document.createElement("div");
    const titleGerman = document.createElement("span");
    titleGerman.textContent = "German - ";
    german.appendChild(titleGerman);
    const wordInGerman = document.createElement("span");
    wordInGerman.textContent = result.word.german;
    german.appendChild(wordInGerman);
    word.appendChild(german);

    const french = document.createElement("div");
    const titleFrench = document.createElement("span");
    titleFrench.textContent = "French - ";
    french.appendChild(titleFrench);
    const wordInFrench = document.createElement("span");
    wordInFrench.textContent = result.word.french;
    french.appendChild(wordInFrench);
    word.appendChild(french);

    wrapper.appendChild(word);
    
    const traduction = document.createElement("div");

    const proposed = document.createElement("div");
    const titleTraductionProposed = document.createElement("span");
    titleTraductionProposed.textContent = "Traduction proposed - ";
    proposed.appendChild(titleTraductionProposed);
    const traductionProposed = document.createElement("span");
    traductionProposed.textContent = result.traduction;
    proposed.appendChild(traductionProposed);
    traduction.appendChild(proposed);

    const isCorrect = document.createElement("div");
    const titleTraductionIsCorrect = document.createElement("span");
    titleTraductionIsCorrect.textContent = "Traduction is correct? ";
    isCorrect.appendChild(titleTraductionIsCorrect);
    const traductionIsCorrect = document.createElement("span");
    traductionIsCorrect.textContent = result.traductionIsCorrect ? "Yes" : "No";
    isCorrect.appendChild(traductionIsCorrect);
    traduction.appendChild(isCorrect);

    wrapper.appendChild(traduction);
    wrapper.appendChild(document.createElement("br"));
  }
  document.getElementById("final-results").appendChild(wrapper);
}

(displayNextWord)();
(function ()
{
  const input = document.getElementById("answer");
  input.addEventListener("keydown", verifyWordIfKeyIsEnter);
})();