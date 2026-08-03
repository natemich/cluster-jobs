# Setup — GitHub Pages transport

Do steps 1–6 once. After that the only thing that ever changes is
`status.json`, pushed automatically.

Assumes Windows on the lab PC and `git` installed
(`winget install Git.Git`, then reopen PowerShell).

---

## 1. Create the repo (browser, 1 min)

github.com → **New repository**

- Name: `cluster-jobs`
- **Public** — if your account can't create public repos (school/org
  accounts usually can't), stop here and use **`SETUP-private.md`**
  instead; everything else on this page still applies
- Do **not** add a README or .gitignore

## 2. Clone it on the lab PC

```powershell
cd $HOME
git clone https://github.com/<you>/cluster-jobs.git
```

First `git push` will ask you to sign in — let Git Credential Manager open
the browser and authorize. That's stored, so the scheduled pushes are
silent afterwards. (Alternative: `winget install GitHub.cli` then
`gh auth login`.)

## 3. Put the app in it

Copy these into `$HOME\cluster-jobs\` (repo root, not a subfolder):

```
index.html  status.json  manifest.json  sw.js  icon-192.png  icon-512.png
```

```powershell
cd $HOME\cluster-jobs
git add .
git commit -m "app"
git push
```

## 4. Turn on Pages

Repo → **Settings** → **Pages** → Source: **Deploy from a branch** →
Branch `main`, folder `/ (root)` → Save. Wait ~1 minute.

Your URL: `https://<you>.github.io/cluster-jobs/`

Open it on the lab PC first to confirm it loads.

## 5. Install it on the iPhone

Open that URL in **Safari** (Chrome cannot install to the home screen) →
Share ⇪ → **Add to Home Screen** → Add.

You now have an icon that opens full-screen, no address bar. It works with
no signal (last data cached); with signal it re-reads on open and every
5 min.

## 6. Wire the publisher in

Copy `publish.ps1` to `C:\Users\nsmichno\.claude\skills\track-job\`.

Test it by hand once:

```powershell
powershell -ExecutionPolicy Bypass -File C:\Users\nsmichno\.claude\skills\track-job\publish.ps1
```

Expect `pushed status.json 14:12:03`. Refresh the phone — the freshness
strip should say "polled just now".

Then add one line to the end of the skill's **Step 5** in `SKILL.md`:

> After writing `status.json`, run:
> `powershell -ExecutionPolicy Bypass -File <skills>\track-job\publish.ps1`
> and report the push result. If it fails, say so — do not claim the phone
> has fresh data.

`publish.ps1` takes two optional params if your paths differ:
`-Repo <clone path> -Status <status.json path>`.

---

## Optional — keep polling without a Claude session

The skill's cron dies with the session. If you want the phone fresh
regardless, add a Task Scheduler job on the lab PC:

- Trigger: daily, repeat every 30 minutes, indefinitely
- Action: `powershell.exe`
  Arguments: `-ExecutionPolicy Bypass -File C:\Users\nsmichno\.claude\skills\track-job\publish.ps1`
- Run whether logged in or not; needs the mapped `Z:\` available (use the
  UNC path `\\server\share\...` in `registry.json` if the drive letter
  isn't mounted for the task's account)

That only re-pushes whatever `status.json` already says. To have it
re-*poll*, point the task at the same parser Claude Code runs — or just
accept that the numbers update when you run `/track-job`, and trust the
stale banner the rest of the time.

---

## Checks when it misbehaves

| Symptom | Cause |
| --- | --- |
| Phone shows old numbers, page says "stale" | nothing pushed since then — run `publish.ps1`, check `git log -1` |
| Phone shows old numbers, page says "polled 2m ago" | CDN cache; the app already appends `?v=<epoch>`, so hard-close and reopen the app |
| 404 at the Pages URL | Pages not enabled yet, or files are in a subfolder instead of the repo root |
| Added to home screen but opens in Safari with bars | it was added from Chrome, or `manifest.json` didn't upload |
| `git push` hangs | credential prompt is waiting in a hidden window — run the push once by hand in PowerShell |
