let rappers = [];
let answer = null;
let clueFields = [];
let maxClues = 0;

const dataUrl = "rappers.json";
const millisecondsPerDay = 24 * 60 * 60 * 1000;
const easternStandardOffsetHours = 5;
const easternStandardOffsetMilliseconds = easternStandardOffsetHours * 60 * 60 * 1000;
const firstPuzzleDay = Math.floor(Date.UTC(2026, 0, 2) / millisecondsPerDay);
const includeStateWithHometown = false;
const baseClueFields = [
  ["Age / Status", "ageStatus", true],
  ["Hometown", "hometown"],
  ["Country", "country"],
  ["Gender", "gender"],
  ["Album", "albumOne"],
  ["Album", "albumTwo"],
  ["First Letter", "firstLetter"],
  ["Signature Clue", "signature", false],
];

let revealedClues = 1;
let guesses = [];
let gameOver = false;
let activeSuggestion = -1;
let dailyResetTimer = null;

const clueGrid = document.querySelector("#clue-grid");
const clueCount = document.querySelector("#clue-count");
const form = document.querySelector("#guess-form");
const input = document.querySelector("#guess-input");
const suggestions = document.querySelector("#suggestions");
const feedback = document.querySelector("#feedback");
const history = document.querySelector("#guess-history");

function normalize(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function getSearchNames(rapper) {
  return [rapper.name, ...(rapper.aliases || [])];
}

function findRapper(value) {
  const needle = normalize(value);

  return rappers.find((rapper) =>
    getSearchNames(rapper).some((name) => normalize(name) === needle)
  );
}

function searchRappers(value) {
  const needle = normalize(value);

  if (!needle) {
    return [];
  }

  return rappers
    .filter((rapper) =>
      getSearchNames(rapper).some((name) => normalize(name).includes(needle))
    )
    .slice(0, 8);
}

function formatHometown(rapper) {
  if (includeStateWithHometown && rapper.state) {
    return `${rapper.hometown}, ${rapper.state}`;
  }

  return rapper.hometown;
}

function getClueValue(rapper, key) {
  if (key === "ageStatus") {
    return getAgeStatus(rapper);
  }

  if (key === "hometown") {
    return formatHometown(rapper);
  }

  return rapper[key];
}

function getAgeStatus(rapper) {
  if (!rapper.birthDate) {
    return rapper.ageStatus;
  }

  const endDate = rapper.deathDate ? new Date(`${rapper.deathDate}T00:00:00Z`) : new Date();
  const birthDate = new Date(`${rapper.birthDate}T00:00:00Z`);
  let age = endDate.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDelta = endDate.getUTCMonth() - birthDate.getUTCMonth();

  if (monthDelta < 0 || (monthDelta === 0 && endDate.getUTCDate() < birthDate.getUTCDate())) {
    age -= 1;
  }

  return `${age} (${rapper.deathDate ? "Deceased" : "Alive"})`;
}

function getAvailableClueFields(rapper) {
  return baseClueFields.filter(([, key, required = true]) => required || Boolean(rapper[key]));
}

function getEasternStandardDate(date = new Date()) {
  return new Date(date.getTime() - easternStandardOffsetMilliseconds);
}

function getEasternStandardPuzzleDay(date = new Date()) {
  const estDate = getEasternStandardDate(date);

  return Math.floor(Date.UTC(estDate.getUTCFullYear(), estDate.getUTCMonth(), estDate.getUTCDate()) / millisecondsPerDay);
}

function getNextEasternStandardResetDelay(date = new Date()) {
  const estDate = getEasternStandardDate(date);
  const nextResetTime = Date.UTC(
    estDate.getUTCFullYear(),
    estDate.getUTCMonth(),
    estDate.getUTCDate() + 1,
    easternStandardOffsetHours,
    0,
    0,
    0
  );

  return Math.max(0, nextResetTime - date.getTime());
}

function hashSeed(value) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function greatestCommonDivisor(left, right) {
  let a = Math.abs(left);
  let b = Math.abs(right);

  while (b) {
    const next = a % b;
    a = b;
    b = next;
  }

  return a;
}

function getCoprimeStep(seed, size) {
  let step = (hashSeed(seed) % size) || 1;

  while (greatestCommonDivisor(step, size) !== 1) {
    step = (step + 1) % size || 1;
  }

  return step;
}

function selectDailyRapper(roster, date = new Date()) {
  const size = roster.length;
  const dayOffset = Math.max(0, getEasternStandardPuzzleDay(date) - firstPuzzleDay);
  const cycle = Math.floor(dayOffset / size);
  const position = dayOffset % size;
  const offset = hashSeed(`rapperdle-offset-${cycle}-${size}`) % size;
  const step = getCoprimeStep(`rapperdle-step-${cycle}-${size}`, size);

  return roster[(offset + position * step) % size];
}

function setDailyRapper(date = new Date()) {
  answer = selectDailyRapper(rappers, date);
  clueFields = getAvailableClueFields(answer);
  maxClues = clueFields.length;
}

function scheduleDailyReset() {
  if (dailyResetTimer) {
    clearTimeout(dailyResetTimer);
  }

  dailyResetTimer = setTimeout(() => {
    setDailyRapper();
    resetGame();
    scheduleDailyReset();
  }, getNextEasternStandardResetDelay() + 1000);
}

function renderClues() {
  if (!answer) {
    return;
  }

  clueGrid.innerHTML = "";
  clueCount.textContent = `${revealedClues}/${maxClues}`;

  clueFields.forEach(([label, key], index) => {
    const isRevealed = index < revealedClues;
    const card = document.createElement("article");
    card.className = `clue-card${isRevealed ? "" : " locked"}`;

    const labelRow = document.createElement("div");
    labelRow.className = "clue-label";
    labelRow.textContent = label;

    const clueIndex = document.createElement("span");
    clueIndex.className = "clue-index";
    clueIndex.textContent = String(index + 1);
    labelRow.append(clueIndex);

    const value = document.createElement("p");
    value.className = "clue-value";
    value.textContent = isRevealed ? getClueValue(answer, key) : "Locked";

    card.append(labelRow, value);
    clueGrid.append(card);
  });
}

function renderSuggestions(matches) {
  suggestions.innerHTML = "";
  activeSuggestion = -1;

  if (!matches.length || gameOver) {
    suggestions.classList.remove("open");
    input.setAttribute("aria-expanded", "false");
    return;
  }

  matches.forEach((rapper) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "suggestion";
    option.setAttribute("role", "option");
    option.textContent = rapper.name;

    // const meta = document.createElement("span");
    // meta.textContent = formatHometown(rapper);
    // option.append(meta);

    option.addEventListener("click", () => {
      input.value = rapper.name;
      closeSuggestions();
      input.focus();
    });

    suggestions.append(option);
  });

  suggestions.classList.add("open");
  input.setAttribute("aria-expanded", "true");
}

function closeSuggestions() {
  suggestions.classList.remove("open");
  input.setAttribute("aria-expanded", "false");
  activeSuggestion = -1;
}

function renderHistory() {
  history.innerHTML = "";

  guesses.forEach((guess) => {
    const item = document.createElement("span");
    item.className = "guess-pill";
    item.textContent = guess;
    history.append(item);
  });
}

function setFeedback(message, type = "") {
  feedback.className = `feedback${type ? ` ${type}` : ""}`;
  feedback.textContent = message;
}

function endGame(won) {
  gameOver = true;
  closeSuggestions();
  input.disabled = true;
  form.querySelector("button").disabled = true;

  if (won) {
    setFeedback(`Correct. It was ${answer.name}.`, "win");
  } else {
    setFeedback(`Out of clues. It was ${answer.name}.`, "lose");
  }

  const playAgain = document.createElement("button");
  playAgain.type = "button";
  playAgain.className = "play-again";
  playAgain.textContent = "Reset";
  playAgain.addEventListener("click", resetGame);
  feedback.append(" ");
  feedback.append(playAgain);
}

function resetGame() {
  revealedClues = 1;
  guesses = [];
  gameOver = false;
  input.disabled = false;
  form.querySelector("button").disabled = false;
  input.value = "";
  renderClues();
  renderHistory();
  setFeedback("Make a guess to unlock the next clue.");
  input.focus();
}

function submitGuess(value) {
  const guess = value.trim();

  if (!guess || gameOver) {
    return;
  }

  const rapper = findRapper(guess);

  if (!rapper) {
    setFeedback("Pick a rapper from the list before guessing.");
    return;
  }

  if (guesses.some((item) => normalize(item) === normalize(rapper.name))) {
    setFeedback("Already guessed that one.");
    input.value = "";
    return;
  }

  guesses.push(rapper.name);
  renderHistory();
  input.value = "";
  closeSuggestions();

  if (rapper.id === answer.id) {
    revealedClues = maxClues;
    renderClues();
    endGame(true);
    return;
  }

  revealedClues = Math.min(maxClues, revealedClues + 1);
  renderClues();

  if (revealedClues === maxClues && guesses.length >= maxClues) {
    endGame(false);
    return;
  }

  setFeedback("Nope. Another clue just dropped.");
}

input.addEventListener("input", (event) => {
  renderSuggestions(searchRappers(event.target.value));
});

input.addEventListener("keydown", (event) => {
  const options = [...suggestions.querySelectorAll(".suggestion")];

  if (!options.length || !suggestions.classList.contains("open")) {
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    activeSuggestion = (activeSuggestion + 1) % options.length;
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    activeSuggestion = (activeSuggestion - 1 + options.length) % options.length;
  } else if (event.key === "Enter" && activeSuggestion >= 0) {
    event.preventDefault();
    input.value = options[activeSuggestion].childNodes[0].textContent;
    closeSuggestions();
    return;
  } else if (event.key === "Escape") {
    closeSuggestions();
    return;
  } else {
    return;
  }

  options.forEach((option, index) => {
    option.classList.toggle("active", index === activeSuggestion);
  });
});

document.addEventListener("click", (event) => {
  if (!form.contains(event.target)) {
    closeSuggestions();
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  submitGuess(input.value);
});

async function loadRappers() {
  const response = await fetch(dataUrl);

  if (!response.ok) {
    throw new Error(`Unable to load ${dataUrl}`);
  }

  const data = await response.json();
  const roster = Array.isArray(data) ? data : data.rappers;

  if (!Array.isArray(roster) || !roster.length) {
    throw new Error(`${dataUrl} did not contain any rappers`);
  }

  return roster;
}

async function init() {
  input.disabled = true;
  form.querySelector("button").disabled = true;
  setFeedback("Loading rapper roster...");

  try {
    rappers = await loadRappers();
    setDailyRapper();
    input.disabled = false;
    form.querySelector("button").disabled = false;
    resetGame();
    scheduleDailyReset();
  } catch (error) {
    console.error(error);
    clueCount.textContent = "0/0";
    setFeedback("Could not load the rapper roster. Run the app through a local server and try again.", "lose");
  }
}

init();
