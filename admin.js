const dataUrl = "rappers.json";
const millisecondsPerDay = 24 * 60 * 60 * 1000;
const schedule = window.RapperdleSchedule;
const schedulePageSize = 14;
const baseClueFields = [
  ["Age / Status / Gender", "ageStatus", true],
  ["Hometown", "hometown"],
  ["Album", "albumOne"],
  ["Album", "albumTwo"],
  ["Signature Clue", "signature", false],
];

const elements = {
  error: document.querySelector("#admin-error"),
  errorMessage: document.querySelector("#admin-error-message"),
  activeCount: document.querySelector("#active-count"),
  disabledCount: document.querySelector("#disabled-count"),
  totalCount: document.querySelector("#total-count"),
  countryCount: document.querySelector("#country-count"),
  upcomingBody: document.querySelector("#upcoming-body"),
  scheduleStartDate: document.querySelector("#schedule-start-date"),
  previousSchedule: document.querySelector("#previous-schedule"),
  scheduleToday: document.querySelector("#schedule-today"),
  nextSchedule: document.querySelector("#next-schedule"),
  scheduleRange: document.querySelector("#schedule-range"),
  overrideStatus: document.querySelector("#override-status"),
  overrideStatusMessage: document.querySelector("#override-status-message"),
  clearDailyOverride: document.querySelector("#clear-daily-override"),
  healthList: document.querySelector("#health-list"),
  generatedAt: document.querySelector("#generated-at"),
  sourceSummary: document.querySelector("#source-summary"),
  rosterSearch: document.querySelector("#roster-search"),
  statusFilter: document.querySelector("#status-filter"),
  clearFilters: document.querySelector("#clear-roster-filters"),
  rosterBody: document.querySelector("#roster-body"),
  rosterCount: document.querySelector("#roster-count"),
  rosterEmpty: document.querySelector("#roster-empty"),
};

let roster = [];
let activeRappers = [];
let disabledIds = new Set();
let rosterData = null;
let scheduleStartDay = null;

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(value);
}

function isDisabled(rapper) {
  return rapper.enabled === false || disabledIds.has(rapper.id);
}

function getAvailableClueFields(rapper) {
  return baseClueFields.filter(([, key, required = true]) => required || Boolean(rapper[key]));
}

function formatPuzzleDate(puzzleDay) {
  return new Date(puzzleDay * millisecondsPerDay).toLocaleDateString(undefined, {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatGeneratedDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function clearElement(element) {
  element.replaceChildren();
}

function makeStackedCell(primary, secondary, className = "stacked-text") {
  const cell = document.createElement("td");
  cell.className = className;

  const strong = document.createElement("strong");
  strong.textContent = primary;

  if (secondary) {
    const small = document.createElement("small");
    small.textContent = secondary;
    cell.append(strong, small);
  } else {
    cell.append(strong);
  }

  return cell;
}

function renderStats() {
  const disabledRappers = roster.filter(isDisabled);
  const countries = new Set(activeRappers.map((rapper) => rapper.country).filter(Boolean));

  elements.activeCount.textContent = formatNumber(activeRappers.length);
  elements.disabledCount.textContent = formatNumber(disabledRappers.length);
  elements.totalCount.textContent = formatNumber(roster.length);
  elements.countryCount.textContent = formatNumber(countries.size);
  elements.generatedAt.textContent = formatGeneratedDate(rosterData?.generatedAt);
  elements.sourceSummary.textContent =
    rosterData?.sourceSummary || "Loaded from the local rapper roster.";
}

function getHealthChecks() {
  const idCounts = new Map();
  const activeAliasOwners = new Map();

  roster.forEach((rapper) => {
    idCounts.set(rapper.id, (idCounts.get(rapper.id) || 0) + 1);
  });

  activeRappers.forEach((rapper) => {
    for (const name of [rapper.name, ...(rapper.aliases || [])]) {
      const key = normalize(name);
      if (!activeAliasOwners.has(key)) {
        activeAliasOwners.set(key, new Set());
      }
      activeAliasOwners.get(key).add(rapper.name);
    }
  });

  const duplicateIds = [...idCounts.values()].filter((count) => count > 1).length;
  const incompleteRecords = roster.filter(
    (rapper) =>
      !rapper.id ||
      !rapper.name ||
      !Array.isArray(rapper.aliases) ||
      !rapper.birthDate ||
      !rapper.hometown ||
      !rapper.country ||
      !rapper.gender ||
      !rapper.albumOne ||
      !rapper.albumTwo
  ).length;
  const aliasCollisions = [...activeAliasOwners.values()].filter((owners) => owners.size > 1).length;
  const unknownDisabledIds = [...disabledIds].filter(
    (id) => !roster.some((rapper) => rapper.id === id)
  ).length;

  return [
    {
      label: "Playable schedule",
      value: activeRappers.length ? "Ready" : "Blocked",
      tone: activeRappers.length ? "" : "bad",
    },
    {
      label: "Required fields",
      value: incompleteRecords ? formatNumber(incompleteRecords) + " incomplete" : "All good",
      tone: incompleteRecords ? "bad" : "",
    },
    {
      label: "Duplicate IDs",
      value: duplicateIds ? formatNumber(duplicateIds) + " found" : "None",
      tone: duplicateIds ? "bad" : "",
    },
    {
      label: "Active alias collisions",
      value: aliasCollisions ? formatNumber(aliasCollisions) + " found" : "None",
      tone: aliasCollisions ? "warn" : "",
    },
    {
      label: "Unknown disabled IDs",
      value: unknownDisabledIds ? formatNumber(unknownDisabledIds) + " found" : "None",
      tone: unknownDisabledIds ? "warn" : "",
    },
  ];
}

function renderHealth() {
  clearElement(elements.healthList);

  getHealthChecks().forEach((check) => {
    const row = document.createElement("div");
    row.className = "health-row";

    const label = document.createElement("span");
    label.textContent = check.label;

    const value = document.createElement("span");
    value.className = "health-value" + (check.tone ? " " + check.tone : "");
    value.textContent = check.value;

    row.append(label, value);
    elements.healthList.append(row);
  });
}

function getActiveDailyOverride() {
  const override = schedule.readDailyOverride();
  const rapper = override && activeRappers.find((item) => item.id === override.rapperId);

  return rapper ? { override, rapper } : null;
}

function renderOverrideStatus() {
  const activeOverride = getActiveDailyOverride();

  if (!activeOverride) {
    elements.overrideStatus.hidden = true;
    return;
  }

  const todayPuzzleDay = schedule.getEasternStandardPuzzleDay();

  if (activeOverride.override.puzzleDay === todayPuzzleDay) {
    elements.overrideStatusMessage.textContent =
      `${activeOverride.rapper.name} is today's rapper. The remaining answers have been shifted back one slot.`;
  } else {
    const todayAnswer = schedule.selectDailyRapper(activeRappers);
    elements.overrideStatusMessage.textContent =
      `Schedule override from ${formatPuzzleDate(activeOverride.override.puzzleDay)} is active. Today's rapper is ${todayAnswer.name}.`;
  }

  elements.overrideStatus.hidden = false;
}

function renderSchedule() {
  clearElement(elements.upcomingBody);

  const todayPuzzleDay = schedule.getEasternStandardPuzzleDay();
  scheduleStartDay ??= todayPuzzleDay;
  elements.scheduleStartDate.min = new Date(schedule.firstPuzzleDay * millisecondsPerDay)
    .toISOString().slice(0, 10);
  elements.scheduleStartDate.value = new Date(scheduleStartDay * millisecondsPerDay)
    .toISOString().slice(0, 10);
  elements.scheduleStartDate.disabled = false;
  elements.previousSchedule.disabled = scheduleStartDay <= schedule.firstPuzzleDay;
  elements.scheduleToday.disabled = scheduleStartDay === todayPuzzleDay;
  elements.nextSchedule.disabled = false;
  elements.scheduleRange.textContent =
    `${formatPuzzleDate(scheduleStartDay)} – ${formatPuzzleDate(scheduleStartDay + schedulePageSize - 1)}`;

  for (let index = 0; index < schedulePageSize; index += 1) {
    const puzzleDay = scheduleStartDay + index;
    const answer = schedule.selectDailyRapper(
      activeRappers,
      new Date(puzzleDay * millisecondsPerDay + 12 * 60 * 60 * 1000)
    );

    if (!answer) {
      continue;
    }

    const row = document.createElement("tr");
    const dateCell = document.createElement("td");
    dateCell.className = "date-cell";

    const date = document.createElement("strong");
    date.textContent = formatPuzzleDate(puzzleDay);

    const dayLabel = document.createElement("small");
    const dayOffset = puzzleDay - todayPuzzleDay;
    dayLabel.textContent = dayOffset === 0 ? "Today"
      : dayOffset === -1 ? "Yesterday"
      : dayOffset === 1 ? "Tomorrow"
      : dayOffset < 0 ? `${-dayOffset} days ago`
      : `In ${dayOffset} days`;
    if (dayOffset === 0 || dayOffset === 1) {
      dayLabel.className = "today-label";
    }

    dateCell.append(date, dayLabel);
    row.append(
      dateCell,
      makeStackedCell(answer.name, answer.id, "rapper-cell"),
      makeStackedCell(answer.hometown, answer.country),
      makeStackedCell(getAvailableClueFields(answer).length + " clues", answer.firstLetter ? "Starts with " + answer.firstLetter : "")
    );
    elements.upcomingBody.append(row);
  }

  renderOverrideStatus();
}

function selectScheduleStartDay(puzzleDay) {
  if (!activeRappers.length || !Number.isInteger(puzzleDay) || puzzleDay < schedule.firstPuzzleDay) {
    return;
  }

  scheduleStartDay = puzzleDay;
  renderSchedule();
}

function matchesRosterFilter(rapper, query, status) {
  if (status === "active" && isDisabled(rapper)) {
    return false;
  }

  if (status === "disabled" && !isDisabled(rapper)) {
    return false;
  }

  if (!query) {
    return true;
  }

  const searchableText = [
    rapper.id,
    rapper.name,
    rapper.hometown,
    rapper.country,
    rapper.albumOne,
    rapper.albumTwo,
    ...(rapper.aliases || []),
  ]
    .filter(Boolean)
    .join(" ");

  return normalize(searchableText).includes(query);
}

function renderRoster() {
  clearElement(elements.rosterBody);

  const query = normalize(elements.rosterSearch.value);
  const status = elements.statusFilter.value;
  const activeOverride = getActiveDailyOverride();
  const filteredRappers = roster.filter((rapper) => matchesRosterFilter(rapper, query, status));

  filteredRappers.forEach((rapper) => {
    const disabled = isDisabled(rapper);
    const row = document.createElement("tr");
    if (disabled) {
      row.className = "disabled-row";
    }

    const statusCell = document.createElement("td");
    const statusBadge = document.createElement("span");
    statusBadge.className = "status-badge" + (disabled ? " disabled" : "");
    statusBadge.textContent = disabled ? "Disabled" : "Playable";
    statusCell.append(statusBadge);

    const nameCell = makeStackedCell(rapper.name, rapper.id, "rapper-cell");
    const todayCell = document.createElement("td");
    if (!disabled) {
      const todayButton = document.createElement("button");
      const isToday =
        activeOverride?.override.puzzleDay === schedule.getEasternStandardPuzzleDay() &&
        activeOverride.rapper.id === rapper.id;
      todayButton.type = "button";
      todayButton.className = "quiet-button set-today-button";
      todayButton.textContent = isToday ? "Today's rapper" : "Make today";
      todayButton.disabled = isToday;
      todayButton.title = isToday
        ? "This rapper is already today's rapper"
        : "Make this rapper today's rapper and shift the following answers";
      todayButton.addEventListener("click", () => {
        schedule.saveDailyOverride(rapper.id);
        renderSchedule();
        renderRoster();
      });
      todayCell.append(todayButton);
    } else {
      todayCell.textContent = "—";
    }
    const locationCell = makeStackedCell(rapper.hometown, "");
    const countryCell = document.createElement("td");
    countryCell.textContent = rapper.country || "—";
    const albumsCell = document.createElement("td");
    albumsCell.className = "stacked-text";
    const albumOne = document.createElement("span");
    albumOne.textContent = rapper.albumOne || "—";
    const albumTwo = document.createElement("small");
    albumTwo.textContent = rapper.albumTwo || "—";
    albumsCell.append(albumOne, albumTwo);
    const aliasesCell = document.createElement("td");
    aliasesCell.className = "alias-list";
    aliasesCell.textContent = rapper.aliases?.length ? rapper.aliases.join(" · ") : "—";

    row.append(statusCell, nameCell, todayCell, locationCell, countryCell, albumsCell, aliasesCell);
    elements.rosterBody.append(row);
  });

  elements.rosterCount.textContent =
    formatNumber(filteredRappers.length) +
    " shown · " +
    formatNumber(activeRappers.length) +
    " playable · " +
    formatNumber(roster.length) +
    " total";
  elements.rosterEmpty.hidden = filteredRappers.length !== 0;
}

async function loadRoster() {
  const response = await fetch(dataUrl);

  if (!response.ok) {
    throw new Error("Unable to load " + dataUrl + ".");
  }

  const payload = await response.json();
  const loadedRoster = Array.isArray(payload) ? payload : payload && payload.rappers;

  if (!Array.isArray(loadedRoster) || !loadedRoster.length) {
    throw new Error(dataUrl + " did not contain any rapper records.");
  }

  rosterData = payload;
  disabledIds = new Set(
    Array.isArray(payload) || !payload ? [] : payload.disabledRapperIds || []
  );
  roster = loadedRoster;
  activeRappers = roster.filter((rapper) => !isDisabled(rapper));

  if (!activeRappers.length) {
    throw new Error(dataUrl + " did not contain any playable rappers.");
  }

  renderStats();
  renderHealth();
  renderSchedule();
  renderRoster();
}

function showError(error) {
  elements.errorMessage.textContent = error.message || "Could not load the roster.";
  elements.error.hidden = false;
  elements.activeCount.textContent = "—";
  elements.disabledCount.textContent = "—";
  elements.totalCount.textContent = "—";
  elements.countryCount.textContent = "—";
  elements.rosterCount.textContent = "Roster could not be loaded.";
}

elements.rosterSearch.addEventListener("input", renderRoster);
elements.statusFilter.addEventListener("change", renderRoster);

elements.scheduleStartDate.addEventListener("change", () => {
  if (elements.scheduleStartDate.reportValidity()) {
    selectScheduleStartDay(elements.scheduleStartDate.valueAsNumber / millisecondsPerDay);
  }
});

elements.previousSchedule.addEventListener("click", () => {
  selectScheduleStartDay(Math.max(schedule.firstPuzzleDay, scheduleStartDay - schedulePageSize));
});

elements.nextSchedule.addEventListener("click", () => {
  selectScheduleStartDay(scheduleStartDay + schedulePageSize);
});

elements.scheduleToday.addEventListener("click", () => {
  selectScheduleStartDay(schedule.getEasternStandardPuzzleDay());
});
elements.clearFilters.addEventListener("click", () => {
  elements.rosterSearch.value = "";
  elements.statusFilter.value = "all";
  renderRoster();
  elements.rosterSearch.focus();
});

elements.clearDailyOverride.addEventListener("click", () => {
  schedule.clearDailyOverride();
  renderSchedule();
  renderRoster();
});

window.addEventListener("storage", (event) => {
  if (event.key !== schedule.storageKey) {
    return;
  }

  renderSchedule();
  renderRoster();
});

loadRoster().catch((error) => {
  console.error(error);
  showError(error);
});
