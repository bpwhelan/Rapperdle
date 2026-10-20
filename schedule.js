(function () {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const easternStandardOffsetHours = 5;
  const easternStandardOffsetMilliseconds = easternStandardOffsetHours * 60 * 60 * 1000;
  const firstPuzzleDay = Math.floor(Date.UTC(2026, 0, 1) / millisecondsPerDay);
  const storageKey = "rapperdle-daily-override";

  function getEasternStandardPuzzleDay(date = new Date()) {
    const estDate = new Date(date.getTime() - easternStandardOffsetMilliseconds);

    return Math.floor(
      Date.UTC(estDate.getUTCFullYear(), estDate.getUTCMonth(), estDate.getUTCDate()) /
        millisecondsPerDay
    );
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

  function selectBaseDailyRapper(availableRappers, puzzleDay) {
    const size = availableRappers.length;

    if (!size) {
      return null;
    }

    const dayOffset = Math.max(0, puzzleDay - firstPuzzleDay);
    const cycle = Math.floor(dayOffset / size);
    const position = dayOffset % size;
    const offset = hashSeed("rapperdle-offset-" + cycle + "-" + size) % size;
    const step = getCoprimeStep("rapperdle-step-" + cycle + "-" + size, size);

    return availableRappers[(offset + position * step) % size];
  }

  function readDailyOverride() {
    try {
      const storedValue = window.localStorage.getItem(storageKey);

      if (!storedValue) {
        return null;
      }

      const override = JSON.parse(storedValue);

      if (
        !override ||
        typeof override.rapperId !== "string" ||
        !Number.isInteger(override.puzzleDay)
      ) {
        return null;
      }

      return override;
    } catch (error) {
      return null;
    }
  }

  function saveDailyOverride(rapperId, puzzleDay = getEasternStandardPuzzleDay()) {
    const override = { rapperId, puzzleDay };

    window.localStorage.setItem(storageKey, JSON.stringify(override));
    return override;
  }

  function clearDailyOverride() {
    window.localStorage.removeItem(storageKey);
  }

  function selectDailyRapper(availableRappers, date = new Date(), override = readDailyOverride()) {
    const puzzleDay = getEasternStandardPuzzleDay(date);
    const baseAnswer = selectBaseDailyRapper(availableRappers, puzzleDay);

    if (!override || override.puzzleDay > puzzleDay) {
      return baseAnswer;
    }

    const selectedRapper = availableRappers.find((rapper) => rapper.id === override.rapperId);

    if (!selectedRapper) {
      return baseAnswer;
    }

    const shiftedDay = puzzleDay - override.puzzleDay;

    if (shiftedDay === 0) {
      return selectedRapper;
    }

    // Move the selected rapper to the override day, remove its original slot,
    // and let every rapper between those positions move one day later.
    const shiftedQueueIndex = shiftedDay - 1;
    let queueIndex = 0;
    let sourceDay = 0;
    let removedOriginalSlot = false;

    while (queueIndex <= shiftedQueueIndex) {
      const candidate = selectBaseDailyRapper(
        availableRappers,
        override.puzzleDay + sourceDay
      );
      sourceDay += 1;

      if (!removedOriginalSlot && candidate.id === selectedRapper.id) {
        removedOriginalSlot = true;
        continue;
      }

      if (queueIndex === shiftedQueueIndex) {
        return candidate;
      }

      queueIndex += 1;
    }

    return baseAnswer;
  }

  window.RapperdleSchedule = {
    clearDailyOverride,
    firstPuzzleDay,
    getEasternStandardPuzzleDay,
    readDailyOverride,
    saveDailyOverride,
    selectDailyRapper,
    storageKey,
  };
})();
