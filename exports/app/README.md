# Cluster Jobs — how this actually gets onto your phone

The honest version first:

- A **native** iOS app is not possible from here — that needs a Mac, Xcode,
  and a developer account, and it would be a lot of machinery for a page
  that shows six numbers.
- What you get instead is a **PWA**: after "Add to Home Screen" it has its
  own icon, opens full-screen with no Safari chrome, works offline, and is
  indistinguishable from an app in daily use. It cannot send push
  notifications in your setup, which you already said you don't need.
- The phone and the lab PC never talk directly. The lab PC **publishes**
  `status.json` somewhere on the internet; the phone **reads** it. Pick one
  transport below.

```
lab PC (sims + Claude Code)          internet             iPhone
  /track-job polls dirs        →   status.json on    →   app fetches it
  writes status.json               a static host          on open + every 5 min
```

---

## Files in this folder

| File | What it is |
| --- | --- |
| `index.html` | the app (self-contained; the current `status.json` is inlined as an offline fallback) |
| `status.json` | the data — **this is the only file the lab PC needs to overwrite** |
| `manifest.json` | makes it installable: name, icon, standalone display |
| `sw.js` | service worker: app shell cached, `status.json` network-first |
| `icon-192.png`, `icon-512.png` | home-screen icon |

---

## Transport A — GitHub Pages (recommended: free, https, no server, works off-campus)

One-time:

1. Make a repo, e.g. `nsmichno/cluster-jobs`. It can be public (the data is
   job names and residuals) or private with Pages enabled on a paid plan —
   public is simpler.
2. Copy all six files from this folder into the repo root, commit, push.
3. Repo → Settings → Pages → Source: `main` / `/ (root)`. Wait ~1 min.
4. On your iPhone open `https://nsmichno.github.io/cluster-jobs/` in
   **Safari** (not Chrome — only Safari can install to the home screen),
   then Share → **Add to Home Screen**.

Every poll after that:

5. `/track-job` writes `status.json` into the local clone; the publisher
   script below commits and pushes it. The phone picks it up on next open —
   no reinstall, no republish of the app.

`publish.ps1` (put it next to your clone; called by the skill's Step 5, or
run by Task Scheduler):

```powershell
param([string]$Repo = "C:\Users\nsmichno\cluster-jobs",
      [string]$Status = "C:\Users\nsmichno\.claude\skills\track-job\status.json")
Copy-Item $Status "$Repo\status.json" -Force
Push-Location $Repo
git add status.json
git commit -m "status $(Get-Date -Format s)" --allow-empty | Out-Null
git push --quiet
Pop-Location
```

Cache note: GitHub Pages caches for ~10 min at the CDN. The app requests
`status.json` with `no-store`, which is usually enough; if you see stale
data, have the skill append `?v=<epoch>` to the fetch URL.

## Transport B — Tailscale (no public hosting, data never leaves your machines)

1. Install Tailscale on the lab PC and on your iPhone, same account.
2. On the lab PC, serve this folder: `python -m http.server 8000` in it
   (add it to Task Scheduler at logon so it's always up).
3. On the phone open `http://<tailscale-name>:8000/` and Add to Home Screen.

Caveat: `http://` (not https) means iOS **won't** register the service
worker, so no offline caching — the app still works, it just needs the VPN
up when you open it. Tailscale Serve (`tailscale serve 8000`) gives you a
real https name and gets the offline behaviour back.

## Transport C — no hosting at all (what you have today)

The skill inlines `status.json` into the page and republishes to the same
Claude artifact URL; the home-screen shortcut points at that URL. Works,
but the data is only as fresh as the last republish, and you get no
offline shell. Use A if you can.

---

## What the app does with the data

- Reads `status.json` on open, on tap of the freshness strip, and every 5 min.
- Sorts `RUN → PEND → IDLE → EXIT → DONE`, so a dead job is at the top of
  the finished group, never hidden behind a swipe.
- Charts every entry in each job's `monitors[]` — whatever Claude Code
  decides to send. Add a monitor to the JSON and a new chip appears; the
  app has no hard-coded list. Log-scales a series automatically when it
  spans more than two orders of magnitude.
- Greys the whole list and says "stale" when `polled_at` is older than
  2 × `poll_interval_min`. This is the one thing that keeps it honest,
  since polling stops when the Claude Code session closes.
- Light/dark follows iOS; the ☾/☀ pill overrides and remembers.

Nothing in the app writes anywhere or SSHes anything — it is read-only by
construction.
