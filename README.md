# Rapperle

A small static rapper guessing game built with plain HTML, CSS, and JavaScript.

## Run Locally

Run the static server so the browser can load `rappers.json`:

```bash
npm run dev
```

## Admin Dashboard

Open [`/admin.html`](admin.html) for the roster dashboard. It includes roster health checks, searchable active/disabled records, the next 14 daily answers, and a “Make today” button for playable rappers. The selected override and shifted schedule are saved in browser storage, so they apply to you and friends using that same browser profile.

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
