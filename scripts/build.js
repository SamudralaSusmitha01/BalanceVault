import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🏗️  Building BalanceVault Frontend for Production...');

try {
  execSync('npm run build', {
    cwd: path.join(rootDir, 'client'),
    stdio: 'inherit'
  });
  console.log('✅ Frontend successfully compiled to server/public.');
} catch (err) {
  console.error('❌ Build failed:', err.message);
  process.exit(1);
}
