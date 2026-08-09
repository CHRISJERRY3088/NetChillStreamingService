from pathlib import Path
text = Path('frontend/index.html').read_text(encoding='utf-8')
for i, line in enumerate(text.splitlines(), 1):
    if 'const sectionJson = JSON.stringify(safeSectionTitle)' in line or \
       'const movieJson = JSON.stringify(movieData)' in line or \
       'const movieJson = encodeInlineJson(normalizeMovieForCard(movie, sectionTitle || 'Featured Movie'))' in line or \
       'const sectionJson = encodeInlineJson(sectionTitle)' in line:
        print(i, repr(line))
