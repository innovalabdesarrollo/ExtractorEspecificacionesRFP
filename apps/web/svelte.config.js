import adapter from '@sveltejs/adapter-vercel';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			runtime: 'nodejs22.x',
			regions: ['iad1']
		}),
		// .env del monorepo (PUBLIC_API_URL, WEB_PORT, …)
		env: {
			dir: root,
			publicPrefix: 'PUBLIC_'
		}
	}
};

export default config;
