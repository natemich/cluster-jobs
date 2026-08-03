param(
  # local git clone of the cluster-jobs repo
  [string]$Repo   = "C:\Users\nsmichno\cluster-jobs",
  # status.json written by the /track-job skill
  [string]$Status = "C:\Users\nsmichno\.claude\skills\track-job\status.json"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $Status)) { Write-Error "no status.json at $Status"; exit 1 }
if (-not (Test-Path "$Repo\.git")) { Write-Error "$Repo is not a git clone"; exit 1 }

Copy-Item $Status "$Repo\status.json" -Force

Push-Location $Repo
try {
  git add status.json
  # --allow-empty so an unchanged poll still records that it ran
  git commit -m "status $(Get-Date -Format s)" --allow-empty --quiet
  git push --quiet
  Write-Host "pushed status.json $(Get-Date -Format 'HH:mm:ss')"
} finally {
  Pop-Location
}
