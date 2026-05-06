const rappers = [
  {
    id: "post-malone",
    name: "Post Malone",
    aliases: ["Austin Post", "Austin Richard Post", "Posty"],
    ageStatus: "30, alive",
    hometown: "Grapevine, Texas",
    signature: "Breakout hit: White Iverson",
    albumOne: "Stoney",
    albumTwo: "Beerbongs & Bentleys",
    firstLetter: "P",
  },
  {
    id: "kendrick-lamar",
    name: "Kendrick Lamar",
    aliases: ["K-Dot", "K Dot"],
    ageStatus: "38, alive",
    hometown: "Compton, California",
    signature: "Pulitzer winner",
    albumOne: "good kid, m.A.A.d city",
    albumTwo: "DAMN.",
    firstLetter: "K",
  },
  {
    id: "nicki-minaj",
    name: "Nicki Minaj",
    aliases: ["Onika Maraj", "Roman Zolanski"],
    ageStatus: "43, alive",
    hometown: "Queens, New York",
    signature: "Young Money star",
    albumOne: "Pink Friday",
    albumTwo: "The Pinkprint",
    firstLetter: "N",
  },
  {
    id: "drake",
    name: "Drake",
    aliases: ["Aubrey Graham", "Champagne Papi"],
    ageStatus: "39, alive",
    hometown: "Toronto, Ontario",
    signature: "Started on Degrassi",
    albumOne: "Take Care",
    albumTwo: "Views",
    firstLetter: "D",
  },
  {
    id: "j-cole",
    name: "J. Cole",
    aliases: ["J Cole", "Jermaine Cole"],
    ageStatus: "41, alive",
    hometown: "Fayetteville, North Carolina",
    signature: "Dreamville founder",
    albumOne: "2014 Forest Hills Drive",
    albumTwo: "KOD",
    firstLetter: "J",
  },
  {
    id: "cardi-b",
    name: "Cardi B",
    aliases: ["Belcalis Almanzar"],
    ageStatus: "33, alive",
    hometown: "Bronx, New York",
    signature: "Breakout hit: Bodak Yellow",
    albumOne: "Invasion of Privacy",
    albumTwo: "Gangsta Bitch Music, Vol. 2",
    firstLetter: "C",
  },
  {
    id: "eminem",
    name: "Eminem",
    aliases: ["Slim Shady", "Marshall Mathers"],
    ageStatus: "53, alive",
    hometown: "Detroit, Michigan",
    signature: "Alter ego: Slim Shady",
    albumOne: "The Marshall Mathers LP",
    albumTwo: "The Eminem Show",
    firstLetter: "E",
  },
  {
    id: "jay-z",
    name: "Jay-Z",
    aliases: ["Jay Z", "Shawn Carter", "Hov"],
    ageStatus: "56, alive",
    hometown: "Brooklyn, New York",
    signature: "Roc-A-Fella co-founder",
    albumOne: "Reasonable Doubt",
    albumTwo: "The Blueprint",
    firstLetter: "J",
  },
  {
    id: "nas",
    name: "Nas",
    aliases: ["Nasir Jones", "Nasty Nas"],
    ageStatus: "52, alive",
    hometown: "Queens, New York",
    signature: "Illmatic at 20",
    albumOne: "Illmatic",
    albumTwo: "Stillmatic",
    firstLetter: "N",
  },
  {
    id: "tupac",
    name: "Tupac Shakur",
    aliases: ["2Pac", "Makaveli", "Pac"],
    ageStatus: "dead, died at 25",
    hometown: "East Harlem, New York",
    signature: "Death Row era icon",
    albumOne: "All Eyez on Me",
    albumTwo: "Me Against the World",
    firstLetter: "T",
  },
  {
    id: "biggie",
    name: "The Notorious B.I.G.",
    aliases: ["Biggie Smalls", "Biggie", "Christopher Wallace"],
    ageStatus: "dead, died at 24",
    hometown: "Brooklyn, New York",
    signature: "Junior M.A.F.I.A. mentor",
    albumOne: "Ready to Die",
    albumTwo: "Life After Death",
    firstLetter: "T",
  },
  {
    id: "missy-elliott",
    name: "Missy Elliott",
    aliases: ["Misdemeanor", "Melissa Elliott"],
    ageStatus: "54, alive",
    hometown: "Portsmouth, Virginia",
    signature: "Innovative video director",
    albumOne: "Supa Dupa Fly",
    albumTwo: "Miss E... So Addictive",
    firstLetter: "M",
  },
  {
    id: "lil-wayne",
    name: "Lil Wayne",
    aliases: ["Weezy", "Dwayne Carter"],
    ageStatus: "43, alive",
    hometown: "New Orleans, Louisiana",
    signature: "Young Money founder",
    albumOne: "Tha Carter III",
    albumTwo: "Tha Carter IV",
    firstLetter: "L",
  },
  {
    id: "lauryn-hill",
    name: "Lauryn Hill",
    aliases: ["Ms. Lauryn Hill", "L. Boogie"],
    ageStatus: "50, alive",
    hometown: "South Orange, New Jersey",
    signature: "Fugees standout",
    albumOne: "The Miseducation of Lauryn Hill",
    albumTwo: "MTV Unplugged No. 2.0",
    firstLetter: "L",
  },
  {
    id: "snoop-dogg",
    name: "Snoop Dogg",
    aliases: ["Snoop Doggy Dogg", "Calvin Broadus"],
    ageStatus: "54, alive",
    hometown: "Long Beach, California",
    signature: "G-funk drawl",
    albumOne: "Doggystyle",
    albumTwo: "Tha Doggfather",
    firstLetter: "S",
  },
  {
    id: "tyler-the-creator",
    name: "Tyler, the Creator",
    aliases: ["Tyler Okonma", "Wolf Haley"],
    ageStatus: "35, alive",
    hometown: "Hawthorne, California",
    signature: "Odd Future founder",
    albumOne: "Flower Boy",
    albumTwo: "IGOR",
    firstLetter: "T",
  },
];

const answer = rappers.find((rapper) => rapper.id === "post-malone");
const maxClues = 6;
const clueFields = [
  ["Age / Status", "ageStatus"],
  ["Hometown / State", "hometown"],
  ["Signature Clue", "signature"],
  ["Album", "albumOne"],
  ["Album", "albumTwo"],
  ["First Letter", "firstLetter"],
];

let revealedClues = 1;
let guesses = [];
let gameOver = false;
let activeSuggestion = -1;

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
  return [rapper.name, ...rapper.aliases];
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

function renderClues() {
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
    value.textContent = isRevealed ? answer[key] : "Locked";

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

    const meta = document.createElement("span");
    meta.textContent = rapper.hometown;
    option.append(meta);

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

renderClues();
