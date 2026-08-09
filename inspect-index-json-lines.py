from pathlib import Path
text = Path('frontend/index.html').read_text(encoding='utf-8')
for start in ['const sectionJson = JSON.stringify(safeSectionTitle)',
              'const movieJson = JSON.stringify(movieData)',
              'const movieJson = encodeInlineJson(normalizeMovieForCard(movie, sectionTitle || \'Featured Movie\'))',
              'const sectionJson = encodeInlineJson(sectionTitle)']:
    idx = text.find(start)
    print('START:', start, 'IDX:', idx)
    if idx != -1:
        end = text.find('\n', idx)
        print(repr(text[idx:end]))
        print('---')
