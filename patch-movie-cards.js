const fs = require('fs');
const path = 'C:\\Users\\Administrator\\NetChill\\frontend\\index.html';
let text = fs.readFileSync(path, 'utf8');
text = text.replace("const movieJson = encodeInlineJson(normalizeMovieForCard(movie, sectionTitle || 'Featured Movie')).replace(/</g, '\\u003c').replace(/'/g, \\\"\\\\'\\\");", "const movieJson = encodeInlineJson(normalizeMovieForCard(movie, sectionTitle || 'Featured Movie'));" );
text = text.replace("const sectionJson = encodeInlineJson(sectionTitle).replace(/</g, '\\u003c').replace(/'/g, \\\"\\\\'\\\");", "const sectionJson = encodeInlineJson(sectionTitle);");
fs.writeFileSync(path, text);
console.log('patched movie cards');
