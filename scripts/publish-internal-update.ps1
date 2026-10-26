param(
  [string]$Summary = "internal OTA update"
)

$ErrorActionPreference = "Stop"
$revision = (git rev-parse HEAD).Trim()
$dirty = (git status --porcelain)
$workingTree = if ($dirty) { " + working tree" } else { "" }
$date = Get-Date -Format "yyyy-MM-dd"
$message = "V1CE OTA | $date | channel internal | $Summary | source $revision$workingTree"

Write-Host "Publishing: $message"
eas update --channel internal --message $message
