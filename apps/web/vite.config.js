import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, '../..', '');
	const webPort = Number(env.WEB_PORT) || 5192;

	return {
		plugins: [tailwindcss(), sveltekit()],
		envDir: '../../',
		envPrefix: ['VITE_', 'PUBLIC_'],
		server: {
			port: webPort,
			strictPort: true,
			host: '127.0.0.1',
			// Evita EMFILE: no vigilar uploads, API ni stores (use CHOKIDAR_USEPOLLING=1 si el SO limita FDs)
			watch: {
				usePolling: process.env.CHOKIDAR_USEPOLLING === '1',
				ignored: [
					'**/node_modules/**',
					'**/.git/**',
					'**/.pnpm-store/**',
					'**/uploads/**',
					'**/apps/api/**',
					'**/scripts/fixtures/**',
					'**/scripts/reports/**'
				]
			}
		},
		preview: {
			port: webPort,
			strictPort: true
		}
	};
});
