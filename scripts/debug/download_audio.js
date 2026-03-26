import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const url = 'https://media1.vocaroo.com/mp3/13ByKGcYGqyq';
const dir = path.join(__dirname, 'public', 'audio');
const filePath = path.join(dir, 'claridad.mp3');

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

const options = {
    headers: {
        'Referer': 'https://vocaroo.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    }
};

console.log(`Downloading from ${url}...`);

https.get(url, options, (res) => {
    if (res.statusCode === 200) {
        const file = fs.createWriteStream(filePath);
        res.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log('Success: claridad.mp3 saved.');
            process.exit(0);
        });
    } else {
        console.error(`Failed: Status code ${res.statusCode}`);
        process.exit(1);
    }
}).on('error', (err) => {
    console.error('Error:', err.message);
    process.exit(1);
});
