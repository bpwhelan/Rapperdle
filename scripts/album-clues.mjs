export function normalizeTitle(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}

export function albumRevealsArtist(title, artist) {
  const album = normalizeTitle(title);
  const names = [artist.name, ...(artist.aliases ?? [])];
  return names.map(normalizeTitle)
    .filter(Boolean)
    .some((name) => album === name || (name.length >= 3 && album.includes(name)));
}

export function selectAlbumClues(releaseGroups, artist) {
  const rank = (group) => group["primary-type"] === "EP" ? 2
    : (group["secondary-types"] ?? []).includes("Mixtape/Street") ? 1 : 0;

  return releaseGroups
    .filter((group) => ["Album", "EP"].includes(group["primary-type"]))
    .filter((group) => (group["secondary-types"] ?? []).every((type) =>
      type === "Mixtape/Street" || (group["primary-type"] === "EP" && type === "Remix")))
    .filter((group) => group.title && group["first-release-date"])
    .filter((group) => !albumRevealsArtist(group.title, artist))
    .sort((left, right) => rank(left) - rank(right)
      || left["first-release-date"].localeCompare(right["first-release-date"])
      || left.title.localeCompare(right.title))
    .map((group) => group.title.replace(/\s+/g, " ").trim())
    .filter((title, index, all) => all.findIndex((candidate) => normalizeTitle(candidate) === normalizeTitle(title)) === index);
}
