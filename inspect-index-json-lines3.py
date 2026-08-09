from pathlib import Path
text = Path('frontend/index.html').read_text(encoding='utf-8')
patterns = [
    'const sectionJson = JSON.stringify(safeSectionTitle)',
    'const movieJson = JSON.stringify(movieData)',
    'const movieJson = encodeInlineJson(normalizeMovieForCard(movie, sectionTitle ||',
    'const sectionJson = encodeInlineJson(sectionTitle)'
]
for i, line in enumerate(text.splitlines(), 1):
    if any(p in line for p in patterns):
        print(i, repr(line))
