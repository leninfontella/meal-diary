import { build, createServer, loadEnv } from 'vite';
import { fileURLToPath } from 'node:url';

const webDirectory = fileURLToPath(new URL('..', import.meta.url));
const repositoryDirectory = fileURLToPath(new URL('../..', import.meta.url));
const command = process.argv[2] ?? 'dev';
const mode = command === 'build' ? 'production' : 'development';
const rootEnv = loadEnv(mode, repositoryDirectory, '');
const webEnv = loadEnv(mode, webDirectory, '');

process.env.VITE_SUPABASE_URL ||= webEnv.VITE_SUPABASE_URL || rootEnv.EXPO_PUBLIC_SUPABASE_URL || '';
process.env.VITE_SUPABASE_ANON_KEY ||= webEnv.VITE_SUPABASE_ANON_KEY || rootEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (command === 'build') {
  await build({ root: webDirectory });
} else {
  const server = await createServer({ root: webDirectory });
  await server.listen();
  server.printUrls();
}
