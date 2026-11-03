import { defineConfig, devices } from '@playwright/test';

const WEB = process.env.WEB_BASE || 'http://127.0.0.1:5192';
const API = process.env.API_BASE || 'http://127.0.0.1:3052';

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: false,
	workers: 1,
	retries: 0,
	timeout: 120_000,
	expect: { timeout: 15_000 },
	reporter: [['list']],
	use: {
		baseURL: WEB,
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'off'
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: [
		{
			command: 'pnpm --filter @extractor-rfp/api start',
			url: `${API}/api/health`,
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
			cwd: '.'
		},
		{
			command: 'CHOKIDAR_USEPOLLING=1 pnpm --filter @extractor-rfp/web exec vite dev --host 127.0.0.1 --port 5192 --strictPort',
			url: WEB,
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
			cwd: '.'
		}
	]
});
