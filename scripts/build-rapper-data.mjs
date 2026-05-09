import { writeFile } from "node:fs/promises";

const USER_AGENT = "RapperleDataBuilder/1.0 (local project; data refresh script)";
const TODAY = new Date("2026-05-09T00:00:00Z");
const MUSICBRAINZ_API = "https://musicbrainz.org/ws/2";

const SEARCHES = [
  { country: "US", query: "tag:rapper AND country:US AND type:person", max: 500, strict: true },
  { country: "GB", query: "tag:rapper AND country:GB AND type:person", max: 500, strict: true },
  { country: "US", query: "tag:rap AND country:US AND type:person", max: 500, strict: false },
  { country: "GB", query: "tag:rap AND country:GB AND type:person", max: 500, strict: false },
  { country: "US", query: "tag:hip-hop AND country:US AND type:person", max: 500, strict: false },
  { country: "GB", query: "tag:hip-hop AND country:GB AND type:person", max: 500, strict: false },
  { country: "US", query: "tag:hip hop AND country:US AND type:person", max: 500, strict: false },
  { country: "GB", query: "tag:hip hop AND country:GB AND type:person", max: 500, strict: false },
  { country: "US", query: "tag:drill AND country:US AND type:person", max: 250, strict: false },
  { country: "GB", query: "tag:grime AND country:GB AND type:person", max: 250, strict: false },
  { country: "GB", query: "tag:uk drill AND country:GB AND type:person", max: 250, strict: false },
];

const RAP_TAGS = new Set([
  "abstract hip hop",
  "alternative hip hop",
  "atl hip hop",
  "boom bap",
  "chicago drill",
  "chicago rap",
  "cloud rap",
  "comedy rap",
  "conscious hip hop",
  "conscious rap",
  "contemporary rap",
  "crunk",
  "detroit hip hop",
  "drill",
  "east coast hip hop",
  "emo rap",
  "experimental hip hop",
  "g-funk",
  "gangsta rap",
  "grime",
  "hardcore hip hop",
  "hip hop",
  "hip-hop",
  "horrorcore",
  "hyphy",
  "jazz rap",
  "memphis rap",
  "midwest hip hop",
  "mumble rap",
  "political hip hop",
  "pop rap",
  "rap",
  "rapper",
  "southern hip hop",
  "trap",
  "trap rap",
  "uk drill",
  "underground hip hop",
  "west coast hip hop",
]);

const NON_RAPPER_DISAMBIGUATION = /\b(singer|songwriter|producer|dj|actor|comedian|writer|bassist|guitarist|drummer|pianist)\b/i;
const RAPPER_DISAMBIGUATION = /\b(rapper|mc|emcee|grime|drill)\b/i;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function ageOn(birthDate, deathDate = "") {
  const end = deathDate ? new Date(`${deathDate}T00:00:00Z`) : TODAY;
  const birth = new Date(`${birthDate}T00:00:00Z`);
  let age = end.getUTCFullYear() - birth.getUTCFullYear();
  const monthDelta = end.getUTCMonth() - birth.getUTCMonth();

  if (monthDelta < 0 || (monthDelta === 0 && end.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }

  return age;
}

function musicBrainzUrl(path, params = {}) {
  const url = new URL(`${MUSICBRAINZ_API}/${path}`);
  Object.entries({ fmt: "json", ...params }).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url;
}

async function fetchJson(url, throttle = 0) {
  if (throttle) {
    await sleep(throttle);
  }

  for (let attempt = 1; attempt <= 8; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });

    if (response.ok) {
      return response.json();
    }

    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 8) {
      throw new Error(`${response.status} ${response.statusText}: ${url}`);
    }

    const retryAfter = Number(response.headers.get("retry-after"));
    await sleep(Number.isFinite(retryAfter) ? retryAfter * 1000 : attempt * 1500);
  }
}

function tagMap(artist) {
  return new Map((artist.tags ?? []).map((tag) => [tag.name.toLowerCase(), tag.count ?? 0]));
}

function hasRapSignal(artist, strict) {
  const tags = tagMap(artist);
  const disambiguation = artist.disambiguation ?? "";

  if (RAPPER_DISAMBIGUATION.test(disambiguation)) {
    return true;
  }

  if (tags.has("rapper")) {
    return true;
  }

  if (strict) {
    return false;
  }

  const rapScore = [...tags.entries()].reduce((score, [name, count]) => {
    return score + (RAP_TAGS.has(name) ? Math.max(1, count) : 0);
  }, 0);

  const nonRapScore = ["pop", "r&b", "soul", "rock", "dance", "country", "jazz"].reduce((score, name) => {
    return score + Math.max(0, tags.get(name) ?? 0);
  }, 0);

  if (NON_RAPPER_DISAMBIGUATION.test(disambiguation) && rapScore < 10) {
    return false;
  }

  return rapScore >= 6 && rapScore >= nonRapScore * 1.5;
}

function hasRequiredArtistFacts(artist) {
  return (
    artist.type === "Person" &&
    (artist.country === "US" || artist.country === "GB") &&
    artist.gender &&
    artist["life-span"]?.begin?.length >= 4 &&
    artist["begin-area"]?.name
  );
}

function usefulAliases(primaryName, artist) {
  const seen = new Set([normalize(primaryName)]);
  const result = [];

  for (const alias of artist.aliases ?? []) {
    const value = alias.name?.replace(/\s+/g, " ").trim();
    const key = normalize(value);

    if (!value || !key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(value);
  }

  return result.slice(0, 12);
}

function genderCode(gender) {
  if (gender === "male") return "M";
  if (gender === "female") return "F";
  return gender.slice(0, 1).toUpperCase();
}

function cleanAlbumTitle(title) {
  return String(title ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

async function searchArtists() {
  const artists = new Map();

  for (const search of SEARCHES) {
    let offset = 0;
    let total = 0;
    console.log(`Searching MusicBrainz: ${search.query}`);

    do {
      const data = await fetchJson(
        musicBrainzUrl("artist/", {
          query: search.query,
          limit: "100",
          offset: String(offset),
        }),
        1100,
      );

      total = data.count ?? 0;

      for (const artist of data.artists ?? []) {
        if (!hasRequiredArtistFacts(artist) || !hasRapSignal(artist, search.strict)) {
          continue;
        }

        const current = artists.get(artist.id);
        if (!current || artist.score > current.score) {
          artists.set(artist.id, artist);
        }
      }

      offset += 100;
    } while (offset < total && offset < search.max);
  }

  return [...artists.values()].sort((left, right) => right.score - left.score || left.name.localeCompare(right.name));
}

async function getAlbums(artistId) {
  const releaseGroups = [];
  let offset = 0;

  do {
    const data = await fetchJson(
      musicBrainzUrl("release-group", {
        artist: artistId,
        type: "album",
        limit: "100",
        offset: String(offset),
      }),
      1100,
    );

    releaseGroups.push(...(data["release-groups"] ?? []));
    offset += 100;

    if (offset >= (data["release-group-count"] ?? 0)) {
      break;
    }
  } while (offset < 300);

  return releaseGroups
    .filter((group) => group["primary-type"] === "Album")
    .filter((group) => !(group["secondary-types"] ?? []).length)
    .filter((group) => group.title && group["first-release-date"])
    .sort((left, right) => {
      const dateSort = left["first-release-date"].localeCompare(right["first-release-date"]);
      return dateSort || left.title.localeCompare(right.title);
    })
    .map((group) => cleanAlbumTitle(group.title))
    .filter((title, index, all) => all.findIndex((candidate) => normalize(candidate) === normalize(title)) === index)
    .slice(0, 2);
}

async function main() {
  const artists = await searchArtists();
  console.log(`Candidate artists with required facts: ${artists.length}`);

  const rappers = [];

  for (const [index, artist] of artists.entries()) {
    const albums = await getAlbums(artist.id);

    if (albums.length < 2) {
      continue;
    }

    const birthDate = artist["life-span"].begin;
    const deathDate = artist["life-span"].end;
    const country = artist.country === "GB" ? "United Kingdom" : "United States";
    const entry = {
      id: slugify(artist.name),
      name: artist.name,
      aliases: usefulAliases(artist.name, artist),
      birthDate,
      ...(deathDate ? { deathDate } : {}),
      ageStatus: `${ageOn(birthDate, deathDate)} (${deathDate ? "Deceased" : "Alive"})`,
      hometown: artist["begin-area"].name,
      country,
      gender: genderCode(artist.gender),
      albumOne: albums[0],
      albumTwo: albums[1],
      firstLetter: artist.name.slice(0, 1).toUpperCase(),
      sources: {
        musicBrainz: `https://musicbrainz.org/artist/${artist.id}`,
      },
    };

    rappers.push(entry);

    if ((index + 1) % 25 === 0) {
      console.log(`Processed ${index + 1}/${artists.length}; usable roster ${rappers.length}`);
    }
  }

  const usedIds = new Set();
  const uniqueRappers = rappers
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((rapper) => {
      if (!usedIds.has(rapper.id)) {
        usedIds.add(rapper.id);
        return rapper;
      }

      const revisedId = `${rapper.id}-${slugify(rapper.hometown)}`;
      usedIds.add(revisedId);
      return { ...rapper, id: revisedId };
    });

  const output = {
    generatedAt: new Date().toISOString(),
    sourceSummary:
      "Roster generated from MusicBrainz artist search records and MusicBrainz release-group album records. Entries are MusicBrainz Person artists from the US or UK with rap-related tags/disambiguation, known birth date, birthplace, gender, and at least two album release groups.",
    rappers: uniqueRappers,
  };

  await writeFile("rappers.json", `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Wrote rappers.json with ${uniqueRappers.length} rappers`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
