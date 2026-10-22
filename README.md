# Rapperle

A small static rapper guessing game built with plain HTML, CSS, and JavaScript.

## Run Locally

Run the static server so the browser can load `rappers.json`:

```bash
npm run dev
```

## Game Archive

Use **Archive** on the main page to pick a previous day's game, or use the arrows to move between days. **Back to today** returns to the daily puzzle. Each game's guesses and result are kept while the page stays open; **Reset** replays the selected day.

The archive starts January 1, 2026 and follows the same midnight EST schedule and browser-local admin override as the daily game. Answers are calculated from the current roster, so roster changes can affect older games.

## Admin Dashboard

Open [`/admin.html`](admin.html) for the roster dashboard. It includes roster health checks, searchable active/disabled records, and a daily answer schedule. Use **Previous 14 days** and **Next 14 days** to browse, choose a **Start date** to jump to any day from January 1, 2026, or select **Back to today** for the next 14 answers. Past answers use the same current roster and browser-local override as the game archive.

The “Make today” button for playable rappers sets today's answer. The selected override and shifted schedule are saved in browser storage, so they apply to you and friends using that same browser profile.

## Deploy To Vercel

1. Push this folder to a GitHub repository.
2. Import the repository in Vercel.
3. Use these settings:
   - Framework Preset: `Other`
   - Build Command: `npm run build`
   - Output Directory: `.`
4. Deploy.

The `vercel.json` file already sets the build command and output directory, so Vercel should pick these up automatically.
# Rapperdle
