import assert from "node:assert/strict";
import test from "node:test";
import { albumRevealsArtist, selectAlbumClues } from "./album-clues.mjs";
import { validateRoster } from "./validate-roster.mjs";

test("rejects self-titles and names embedded in titles despite punctuation or accents", () => {
  for (const [title, name] of [
    ["AJ Tracey", "AJ Tracey"],
    ["KRS‐ONE", "KRS-One"],
    ["Can‐I‐Bus", "Canibus"],
    ["B.o.B Presents: The Adventures of Bobby Ray", "B.o.B"],
    ["Lupe Fiasco’s The Cool", "Lupe Fiasco"],
    ["Lizzobangers", "Lizzo"],
    ["Lōc‐ed After Dark", "Loc"],
  ]) {
    assert.equal(albumRevealsArtist(title, { name }), true, title);
  }
});

test("catches accepted aliases without matching initials inside ordinary words", () => {
  assert.equal(albumRevealsArtist("I Am Chipmunk", { name: "Chip", aliases: ["Chipmunk"] }), true);
  assert.equal(albumRevealsArtist("The Notorious KIM", { name: "Lil’ Kim", aliases: ["Kim"] }), true);
  assert.equal(albumRevealsArtist("Trap Muzik", { name: "T.I.", aliases: ["Tip"] }), false);
  assert.equal(albumRevealsArtist("17", { name: "XXXTENTACION", aliases: ["X"] }), false);
  assert.equal(albumRevealsArtist("Liquid Swords", { name: "GZA/Genius", aliases: ["GZA", "Genius"] }), false);
});

test("selects distinct safe albums first, with mixtapes and EPs as fallbacks", () => {
  const release = (title, type = "Album", secondary = [], date = "2000") => ({
    title, "primary-type": type, "secondary-types": secondary, "first-release-date": date,
  });
  const groups = [
    release("Artist"), release("Artist presents: Secrets"),
    release("Safe Mixtape", "Album", ["Mixtape/Street"], "1998"),
    release("Safe EP", "EP", [], "1999"),
    release("Safe Album", "Album", [], "2002"),
    release("Safe-Album", "Album", [], "2003"),
    release("Greatest Hits", "Album", ["Compilation"]),
    release("Bootleg", "Album", ["DJ-mix"]),
    release("Single", "Single"), release("Undated", "Album", [], ""),
  ];
  assert.deepEqual(selectAlbumClues(groups, { name: "Artist" }), ["Safe Album", "Safe Mixtape", "Safe EP"]);
});

test("validation includes disabled entries and rejects missing or duplicate clues", () => {
  const rapper = { name: "Artist", enabled: false, albumOne: "Artist", albumTwo: "" };
  assert.throws(() => validateRoster({ rappers: [rapper] }), /reveals the answer[\s\S]*missing albumTwo/);
  assert.throws(() => validateRoster({ rappers: [{ ...rapper, albumOne: "Safe", albumTwo: "SAFE!" }] }), /different releases/);
});
