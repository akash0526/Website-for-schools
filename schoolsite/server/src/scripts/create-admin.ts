import { loadConfig } from '../config/env.js';
import { createDatabaseClient } from '../data/supabase/client.js';
async function main() {
  const config = loadConfig();
  if (config.mode !== 'live')
    throw new Error('Set APP_MODE=live before provisioning an administrator.');
  const email = process.env.ADMIN_EMAIL,
    password = process.env.ADMIN_PASSWORD,
    name = process.env.ADMIN_NAME || 'School Administrator';
  if (!email || !password || password.length < 12)
    throw new Error(
      'Provide ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters. Never commit these values.',
    );
  const client = createDatabaseClient(config);
  const { data, error } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (error || !data.user)
    throw new Error(
      error?.message ||
        'Could not create user. If the user exists, grant access using the SQL example in docs/SETUP.md.',
    );
  const { error: profileError } = await client
    .from('admin_profiles')
    .upsert({ id: data.user.id, name, role: 'owner' });
  if (profileError) {
    await client.auth.admin.deleteUser(data.user.id);
    throw new Error(`Profile creation failed: ${profileError.message}`);
  }
  console.log(
    `Owner access granted to ${email}. Sign in at /admin/login. Remove ADMIN_PASSWORD from your environment now.`,
  );
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Provisioning failed');
  process.exitCode = 1;
});
