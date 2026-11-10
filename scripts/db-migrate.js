import { execSync } from 'child_process';
import { config } from '../server/src/config.js';

console.log('🔄 Applying BalanceVault Database Migrations...');

if (config.databaseUrl && config.databaseUrl.startsWith('postgres')) {
  try {
    console.log('Pushing schema to PostgreSQL database...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ PostgreSQL schema synced successfully.');
  } catch (err) {
    console.error('Prisma db push failed:', err.message);
  }
} else {
  console.log('ℹ️  Operating in embedded zero-config mode. Schema is automatically synchronized.');
}
