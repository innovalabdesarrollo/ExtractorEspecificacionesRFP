import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePdf = path.resolve(__dirname, '../scripts/fixtures/rfp-demo.pdf');
const stamp = Date.now();

test.describe('Flujo funcional MVP (modo DEMO sin Anthropic)', () => {
	test('home muestra aviso de API key y navegación básica', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('heading', { name: /Proyectos RFP/i })).toBeVisible();
		await expect(page.getByText(/ANTHROPIC_API_KEY/i)).toBeVisible();
		await expect(page.getByText(/análisis DEMO/i)).toBeVisible();

		await page.getByRole('link', { name: 'Historial' }).click();
		await expect(page).toHaveURL(/historial/);
		await expect(page.getByRole('heading', { name: /Historial/i })).toBeVisible();

		await page.getByRole('link', { name: 'Checklist' }).click();
		await expect(page).toHaveURL(/checklist/);
		await expect(page.getByRole('heading', { name: /Checklist/i })).toBeVisible();
	});

	test('crea proyecto, sube PDF, corre DEMO y ve resultados', async ({ page }) => {
		await page.goto('/');

		await page.locator('input').nth(0).fill(`E2E Playwright ${stamp}`);
		await page.locator('input').nth(1).fill('Cliente Playwright');
		await page.getByRole('button', { name: /Crear proyecto/i }).click();

		await expect(page).toHaveURL(/\/proyectos\/[a-f0-9]+/i, { timeout: 20_000 });
		await expect(page.getByRole('heading', { name: new RegExp(`E2E Playwright ${stamp}`) })).toBeVisible();

		await page.setInputFiles('input[type="file"]', fixturePdf);
		await expect(page.getByText(/rfp-demo\.pdf/i)).toBeVisible({ timeout: 20_000 });

		const runBtn = page.getByRole('button', { name: /Ejecutar análisis DEMO/i });
		await expect(runBtn).toBeEnabled();
		await runBtn.click();

		await expect(page.getByText(/DEMO\s*·\s*sin API key Anthropic/i)).toBeVisible({
			timeout: 90_000
		});
		await expect(page.getByText(/completado/i).first()).toBeVisible({ timeout: 30_000 });

		await page.getByRole('link', { name: 'Resultados' }).first().click();
		await expect(page).toHaveURL(/\/analisis\//);
		await expect(page.getByText(/MODO DEMO|ANTHROPIC_API_KEY/i).first()).toBeVisible();
		await expect(page.getByText(/encontrado|Área total|12500/i).first()).toBeVisible({
			timeout: 15_000
		});

		await page.getByRole('link', { name: /Vista arquitecto/i }).click();
		await expect(page).toHaveURL(/\/arquitecto\//);
		await expect(page.getByText(/Vista arquitecto/i).first()).toBeVisible();
		await expect(page.getByText(/MODO DEMO|ANTHROPIC_API_KEY/i).first()).toBeVisible();
	});
});
