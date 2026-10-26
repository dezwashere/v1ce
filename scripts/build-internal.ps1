param(
  [string]$Summary = "coin/widget UI and build diagnostics"
)

$ErrorActionPreference = "Stop"
$revision = (git rev-parse HEAD).Trim()
$dirty = (git status --porcelain)
$workingTree = if ($dirty) { " + working tree" } else { "" }
$date = Get-Date -Format "yyyy-MM-dd"
$message = "V1CE | internal | $date | $Summary | source $revision$workingTree"

Write-Host "Submitting: $message"
eas build --platform ios --profile internal --message $message
