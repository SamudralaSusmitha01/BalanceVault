import { bootstrapFirstAdmin, getBootstrapStatus } from '../server/src/services/bootstrapService.js';
import { config } from '../server/src/config.js';

async function runCliBootstrap() {
  const args = process.argv.slice(2);
  let email = 'admin@balancevault.com';
  let password = 'AdminPassword123!';
  let fullName = 'System Administrator';
  let secret = config.bootstrapSecret;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) email = args[++i];
    if (args[i] === '--password' && args[i + 1]) password = args[++i];
    if (args[i] === '--name' && args[i + 1]) fullName = args[++i];
    if (args[i] === '--secret' && args[i + 1]) secret = args[++i];
  }

  console.log('========================================================');
  console.log('🔐 BalanceVault - First Administrator CLI Bootstrap');
  console.log('========================================================');

  const status = await getBootstrapStatus();
  if (status.isLocked) {
    console.error('❌ Error: Administrator already exists in this database.');
    console.error('   The first-admin bootstrap process is permanently locked.');
    process.exit(1);
  }

  try {
    const result = await bootstrapFirstAdmin({
      email,
      password,
      fullName,
      secret
    });

    console.log('✅ Administrator successfully bootstrapped:');
    console.log(`   ID:       ${result.user.id}`);
    console.log(`   Email:    ${result.user.email}`);
    console.log(`   Role:     ${result.user.role}`);
    console.log(`   Status:   ${result.user.status}`);
    console.log('========================================================');
    process.exit(0);
  } catch (err) {
    console.error('❌ Bootstrap failed:', err.message);
    process.exit(1);
  }
}

runCliBootstrap();
