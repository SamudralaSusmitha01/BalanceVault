import { execSync } from 'child_process';
import { config } from '../server/src/config.js';

console.log('🔄 BalanceVault Database Schema Sync...');

if (config.databaseUrl && config.databaseUrl.startsWith('postgres')) {
  try {
    console.log('Detected PostgreSQL connection string. Running prisma generate...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated successfully.');
  } catch (err) {
    console.error('Prisma generate encountered an error:', err.message);
  }
} else {
  console.log('ℹ️  No remote PostgreSQL URL provided (DATABASE_URL unset or local).');
  console.log('   BalanceVault active with embedded zero-dependency high performance storage.');
  console.log('   Prisma PostgreSQL schema is available in prisma/schema.prisma for deployment.');
}
