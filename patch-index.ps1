$path = 'C:\Users\Administrator\NetChill\frontend\index.html'
$text = [System.IO.File]::ReadAllText($path)
$patterns = @(
  @{
    Prefix = "const movieJson = JSON.stringify(normalizeMovieForCard(movie, sectionTitle"
    Replacement = "const movieJson = encodeInlineJson(normalizeMovieForCard(movie, sectionTitle || 'Featured Movie'))"
  },
  @{
    Prefix = "const sectionJson = JSON.stringify(sectionTitle)"
    Replacement = "const sectionJson = encodeInlineJson(sectionTitle)"
  }
)
foreach ($pattern in $patterns) {
  $start = $text.IndexOf($pattern.Prefix)
  if ($start -ge 0) {
    $end = $text.IndexOf(';', $start)
    if ($end -ge 0) {
      $text = $text.Substring(0, $start) + $pattern.Replacement + $text.Substring($end + 1)
    }
  }
}
[System.IO.File]::WriteAllText($path, $text)
Write-Host 'patched'
