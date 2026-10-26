$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$site = Join-Path $root 'site'
$html = [IO.File]::ReadAllText((Join-Path $site 'index.html'))
foreach ($match in [regex]::Matches($html, '(?:src|href)="([^"#]+)"')) {
    $reference = $match.Groups[1].Value
    if ($reference -match '^(https?:|mailto:|data:)') { continue }
    $path = ($reference -split '[?#]')[0]
    if (-not (Test-Path -LiteralPath (Join-Path $site $path))) { throw "Missing site reference: $reference" }
}
foreach ($match in [regex]::Matches($html, 'href="#([^"]+)"')) {
    if ($html -notmatch ('id="' + [regex]::Escape($match.Groups[1].Value) + '"')) { throw "Missing anchor: $($match.Groups[1].Value)" }
}
foreach ($file in Get-ChildItem (Join-Path $site 'assets') -File) {
    $candidates = @('assets/screenshots', 'assets/brand', 'assets/diagrams') | ForEach-Object { Join-Path (Join-Path $root $_) $file.Name }
    foreach ($candidate in $candidates) {
        if ((Test-Path -LiteralPath $candidate) -and (Get-FileHash $candidate).Hash -ne (Get-FileHash $file.FullName).Hash) { throw "Asset differs: $($file.Name)" }
    }
}
foreach ($file in Get-ChildItem $root -Recurse -Filter *.md | Where-Object { $_.FullName -notmatch '[\\/]\.git[\\/]' }) {
    $markdown = [IO.File]::ReadAllText($file.FullName)
    foreach ($match in [regex]::Matches($markdown, '(?:\]\(|src=")([^\s)"<>]+)')) {
        $reference = $match.Groups[1].Value
        if ($reference -match '^(https?:|mailto:|#)') { continue }
        $path = ($reference -split '[?#]')[0]
        if (-not (Test-Path -LiteralPath (Join-Path $file.DirectoryName $path))) { throw "Missing Markdown reference in $($file.Name): $reference" }
    }
}
$inventory = [IO.File]::ReadAllText((Join-Path $root 'assets/screenshots/SCREENSHOTS.md'))
$shots = @(Get-ChildItem (Join-Path $root 'assets/screenshots') -Filter *.jpg)
if ($inventory -notmatch ('已入库素材（' + $shots.Count + ' 张）')) { throw 'Screenshot count mismatch' }
foreach ($shot in $shots) {
    if (-not $inventory.Contains($shot.Name)) { throw "Screenshot not listed: $($shot.Name)" }
    if ($shot.Length -gt 102400) { throw "Screenshot exceeds 100KB: $($shot.Name)" }
}
if ((Get-FileHash (Join-Path $root 'demo/demo-video.mp4')).Hash -ne (Get-FileHash (Join-Path $site 'media/demo-video.mp4')).Hash) { throw 'Video differs' }
Write-Output 'PASS: site references, anchors, Markdown links, shared assets, screenshot inventory and video copies.'
