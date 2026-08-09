from pathlib import Path
path = Path('frontend/index.html')
text = path.read_text(encoding='utf-8')
replacements = {
    "const sectionJson = JSON.stringify(safeSectionTitle).replace(/</g, '\\u003c').replace(/'/g, \"\\'\");": "const sectionJson = encodeInlineJson(safeSectionTitle);",
    "const movieJson = JSON.stringify(movieData).replace(/</g, '\\u003c').replace(/'/g, \"\\'\");": "const movieJson = encodeInlineJson(movieData);",
    "const movieJson = encodeInlineJson(normalizeMovieForCard(movie, sectionTitle || 'Featured Movie')).replace(/</g, '\\u003c').replace(/'/g, \"\\'\");": "const movieJson = encodeInlineJson(normalizeMovieForCard(movie, sectionTitle || 'Featured Movie'));",
    "const sectionJson = encodeInlineJson(sectionTitle).replace(/</g, '\\u003c').replace(/'/g, \"\\'\");": "const sectionJson = encodeInlineJson(sectionTitle);",
}
for old, new in replacements.items():
    if old in text:
        text = text.replace(old, new)
    else:
        print('missing:', old)
path.write_text(text, encoding='utf-8')
print('patched')
