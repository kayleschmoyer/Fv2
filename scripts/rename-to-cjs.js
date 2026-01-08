import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distElectronDir = path.join(__dirname, '../dist/electron');

function renameJsToCjs(dir) {
  if (!fs.existsSync(dir)) {
    console.log('No dist/electron directory found, skipping rename');
    return;
  }

  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      renameJsToCjs(fullPath);
    } else if (file.endsWith('.js')) {
      const newPath = fullPath.replace(/\.js$/, '.cjs');
      fs.renameSync(fullPath, newPath);
      console.log(`Renamed: ${file} -> ${file.replace('.js', '.cjs')}`);
    }
  });
}

renameJsToCjs(distElectronDir);
console.log('Successfully renamed all .js files to .cjs in dist/electron');
