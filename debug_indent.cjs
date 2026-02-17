
const fs = require('fs');
const path = 'c:\\Users\\jmart\\Documents\\Escuela Cuid-Arte\\Gestion de leads\\components\\Layout.tsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');
const line = lines[313]; // 0-indexed for 314
console.log('Line 314:', JSON.stringify(line));
console.log('Leading whitespace:', line.length - line.trimStart().length);
console.log('Raw:', line);
