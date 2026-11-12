import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🏗️  Building BalanceVault Frontend for Production...');

try {
  // Ensure hoisted root node_modules/.bin (where vite binary resides in npm workspaces) is in PATH
  const rootBin = path.join(rootDir, 'node_modules', '.bin');
  const clientBin = path.join(rootDir, 'client', 'node_modules', '.bin');
  const env = {
    ...process.env,
    PATH: `${rootBin}${path.delimiter}${clientBin}${path.delimiter}${process.env.PATH || ''}`
  };

  execSync('npm run build --workspace=client', {
    cwd: rootDir,
    stdio: 'inherit',
    env
  });
  console.log('✅ Frontend successfully compiled to server/public.');
} catch (err) {
  console.error('❌ Build failed:', err.message);
  process.exit(1);
}
