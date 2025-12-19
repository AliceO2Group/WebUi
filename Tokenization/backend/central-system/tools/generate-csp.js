import fs from 'fs';
import crypto from 'crypto';

const indexPath = '../../public/index.html';
const outPath = './csp-hashes.json';

if (!fs.existsSync(indexPath)) {
  console.error('index.html not found at', indexPath);
  process.exit(2);
}

let html = fs.readFileSync(indexPath, 'utf8');
// regex matching script tags without src attribute
const scriptTagRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi; 
const hashes = [];
let match;

while ((match = scriptTagRegex.exec(html)) !== null) {
  const attrs = match[1];
  const content = match[2];

  if (/(\s|^)src\s*=/i.test(attrs)) continue;

  const hash = crypto.createHash('sha256').update(content, 'utf8').digest('base64');
  hashes.push(`'sha256-${hash}'`);
}

fs.writeFileSync(outPath, JSON.stringify(hashes, null, 2), 'utf8');