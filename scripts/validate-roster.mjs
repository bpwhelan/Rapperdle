import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { albumRevealsArtist, normalizeTitle } from "./album-clues.mjs";

export function validateRoster(data) {
  const errors = [];

  for (const rapper of data.rappers) {
    for (const key of ["albumOne", "albumTwo"]) {
      if (!rapper[key]?.trim()) {
        errors.push(`${rapper.name}: missing ${key}`);
      } else if (albumRevealsArtist(rapper[key], rapper)) {
        errors.push(`${rapper.name}: ${key} reveals the answer (${rapper[key]})`);
      }
    }
    if (normalizeTitle(rapper.albumOne) === normalizeTitle(rapper.albumTwo)) {
      errors.push(`${rapper.name}: album clues must be different releases`);
    }
  }

  if (errors.length) {
    throw new Error(`Invalid album clues:\n${errors.join("\n")}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const data = JSON.parse(await readFile(new URL("../rappers.json", import.meta.url), "utf8"));
  validateRoster(data);
  console.log(`Validated album clues for all ${data.rappers.length} rappers.`);
}
