import fs from 'fs';
import path from 'path';

const baseDir = 'c:/Users/jmart/Documents/Escuela Cuid-Arte/Gestion de leads';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach( f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const filesToProcess = [];
walkDir(baseDir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    filesToProcess.push(filePath);
  }
});

filesToProcess.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('CheckCircle2')) {
    console.log(`Processing ${file}...`);
    let newContent = content.replace(/CheckCircle2/g, 'CircleCheck');
    fs.writeFileSync(file, newContent);
  }
});
