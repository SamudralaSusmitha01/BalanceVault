import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Starting BalanceVault in Full-Stack Development Mode...');

// Start Server
const serverProcess = spawn('node', ['server/src/index.js'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_ENV: 'development', PORT: '5000' }
});

// Start Client Vite Server
const clientProcess = spawn('npm', ['run', 'dev'], {
  cwd: path.join(rootDir, 'client'),
  stdio: 'inherit',
  shell: true
});

function cleanup() {
  console.log('\nStopping BalanceVault development processes...');
  serverProcess.kill();
  clientProcess.kill();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
