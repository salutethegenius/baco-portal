import { cpSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const sourceDir = join(rootDir, 'dist', 'public');
const targetDir = join(rootDir, 'public');

if (existsSync(sourceDir)) {
  try {
    cpSync(sourceDir, targetDir, { recursive: true });
    console.log(`✓ Copied static files from ${sourceDir} to ${targetDir}`);
  } catch (error) {
    console.error('Error copying static files:', error);
    process.exit(1);
  }
} else {
  console.warn(`Source directory ${sourceDir} does not exist`);
}
