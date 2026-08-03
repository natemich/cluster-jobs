# Setup when the repo can't be public

School/org GitHub accounts usually block public repos, and Pages on a
private repo needs GitHub Enterprise — and even then the phone would have
to be SSO-signed-in to fetch, which breaks the app's background re-read.

So: **keep the repo private on the school account, and let a free static
host serve it.** The repo stays private; the published site is a public
but unguessable URL. Route A below is the one to use.

The app files and `publish.ps1` don't change — only where the site lives.

---

## Route A — Cloudflare Pages from the private repo (recommended)

Free, no credit card, unlimited bandwidth, builds on every push, and it
reads private repos fine.

1. Push the app + `status.json` to your **private** `cluster-jobs` repo
   (steps 2–3 of `SETUP.md` are unchanged).
2. Sign up at `dash.cloudflare.com` → **Workers & Pages** → **Create** →
   **Pages** → **Connect to Git** → authorize GitHub → pick `cluster-jobs`.
3. Build settings: framework preset **None**, build command **empty**,
   output directory `/`. Save and Deploy.
4. You get `https://cluster-jobs-xyz.pages.dev/`. Open **that** in Safari
   on the phone → Share → Add to Home Screen.

Every `git push` from `publish.ps1` redeploys in ~10 seconds. Nothing else
to change.

⚠️ If your school org has **third-party OAuth app restrictions** on, the
Cloudflare authorization will say "request access" and sit pending. Two
ways past it: ask the org owner to approve Cloudflare, or use the
"Cloudflare Pages" GitHub App install scoped to just this one repo (the
connect flow offers "Only select repositories" — that's usually allowed
even when broad OAuth isn't).

Netlify works identically if you prefer it (`app.netlify.com` → Add new
site → Import from Git). Same caveat about org OAuth.

---

## Route B — a second, personal GitHub account

If the org blocks OAuth apps *and* public repos, sidestep it: make a free
personal account, create the public `cluster-jobs` repo there, and follow
`SETUP.md` unchanged. The lab PC just needs that account's credential for
this one clone:

```powershell
cd $HOME\cluster-jobs
git config user.name  "<personal handle>"
git config user.email "<personal email>"
git remote set-url origin https://github.com/<personal>/cluster-jobs.git
```

Nothing about your school account or its repos is involved. This is the
least moving parts if the org is strict.

---

## Route C — no git at all: Cloudflare Pages direct upload

Skip the repo. `publish.ps1` uploads the folder straight to Pages.

```powershell
npm install -g wrangler        # once
wrangler login                 # once, opens browser
```

Then swap the git block in `publish.ps1` for:

```powershell
Copy-Item $Status "$Repo\status.json" -Force
wrangler pages deploy $Repo --project-name=cluster-jobs --commit-dirty=true
```

No GitHub involvement whatsoever. Slightly slower per push (~15 s) and it
needs Node on the lab PC, but it dodges every org policy.

---

## Route D — Tailscale, nothing published anywhere

If the case names themselves are the problem, don't host at all — see
Transport B in `README.md`. Phone and lab PC join a private tailnet;
`tailscale serve` gives an https name only your devices can reach. Costs
nothing for personal use, but the phone needs the VPN toggle on and it
won't work if your phone is on a network that blocks it.

---

## Which to pick

| Situation | Route |
| --- | --- |
| Org allows the Cloudflare GitHub App on one repo | **A** |
| Org blocks OAuth apps entirely | **B** or **C** |
| Data must never leave your devices | **D** |
| You want zero accounts beyond what you have | **C** |
