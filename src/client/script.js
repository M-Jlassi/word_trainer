let currentWord = undefined;
let traduction = undefined;

async function getFirstWord() {
  const response = await fetch('api/get-first-word');
  return response.json();
}

function displayNextWord(nextWord = undefined) {
  if (nextWord != undefined) {
    document.getElementById("word-to-find").textContent = nextWord;
    document.getElementById("answer").value = "";
  }
  else {
    getFirstWord().then(responseJSON => {
      currentWord = responseJSON.firstWord;
      const languageToGuess = currentWord.languageToGuess;
      traduction = languageToGuess === "french" ? currentWord.german : currentWord.french;

      const textToGuess = currentWord[languageToGuess];
      document.getElementById("word-to-find").textContent = textToGuess;
    });
  }
}

async function verifyWordIfKeyIsEnterV2(event) {
  if (event.key === "Enter") {
    const wordToVerify = event.target.value;
    document.activeElement.blur();
    document.getElementById("traduction").textContent = traduction;
    const confirmation = document.getElementById("confirmation");
    confirmation.style.display = "block";

    const oui = document.getElementById("oui");
    const presque = document.getElementById("presque");
    const non = document.getElementById("non");

    const promise = new Promise(resolve => {
      oui.onclick = () => resolve("oui");
      presque.onclick = () => resolve("presque");
      non.onclick = () => resolve("non");
      document.addEventListener('keydown', (event) => handleKeyboard(event, resolve));
    });

    const result = await promise;
    oui.onclick = null;
    presque.onclick = null;
    non.onclick = null;
    document.removeEventListener("keydown", handleKeyboard);

    const queryString = new URLSearchParams({ ...currentWord, result }).toString();

    const response = await fetch("/api/register-result?" + queryString)
    const responseJSON = await response.json();
    currentWord = responseJSON.nextWord;
    const languageToGuess = currentWord.languageToGuess;
    traduction = languageToGuess === "french" ? currentWord.german : currentWord.french;

    const textToGuess = currentWord[languageToGuess];
    document.getElementById("word-to-find").textContent = textToGuess;
    document.getElementById("answer").value = "";
    document.getElementById("answer").focus();

    confirmation.style.display = "none";
  }
}

const handleKeyboard = (event, resolve) => {
  if (event.key === "o")
    resolve("oui");
  if (event.key === "p")
    resolve("presque");
  if (event.key === "n")
    resolve("non");
}

function userValidates() {
  return;
}

function verifyWordIfKeyIsEnter(event) {
  if (event.key == "Enter") {
    const wordToVerify = event.target.value;
    fetch("/api/verify-traduction?word=" + encodeURIComponent(wordToVerify))
      .then(response => response.json())
      .then(async responseJSON => {
        const validation = await askUserValidation();
        sendUserValidation();

        updateNumberOfTraductionsVerified(responseJSON);
        displayTraductionResult(responseJSON);
        displayNextWord(responseJSON.nextWord);
        if (responseJSON.listIsFinished)
          displayFinalResults();
      });
  }
}

function updateNumberOfTraductionsVerified({ numberOfTraductionsVerified, traductionsHistory }) {
  document.getElementById("number-of-words-verified").textContent = numberOfTraductionsVerified;
  document.getElementById("number-of-words-correct").textContent = traductionsHistory.correctMatch.toString();
  document.getElementById("number-of-words-incorrect").textContent = traductionsHistory.incorrectMatch.toString();
}

function displayTraductionResult(responseJSON) {
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
  else {
    const firstChildren = results.children[0];
    results.insertBefore(wrapper, firstChildren);
  }
}

function displayFinalResults() {
  fetch("/api/get-results")
    .then(response => response.json())
    .then(createFinalResultsHTML)
}

function createFinalResultsHTML(responseJSON) {
  const wrapper = document.createElement("div");
  for (const result of responseJSON.results) {
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
(function () {
  const input = document.getElementById("answer");
  // input.addEventListener("keydown", verifyWordIfKeyIsEnter);
  input.addEventListener("keydown", verifyWordIfKeyIsEnterV2);
})();