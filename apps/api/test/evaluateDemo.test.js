import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateDemo } from '../src/services/evaluateDemo.js';

describe('evaluateDemo', () => {
	it('marca demoMode y avisa falta de API key Anthropic', async () => {
		const checklist = [
			{ _id: '1', extractionKey: 'area_total', name: 'Área total', categoryName: 'Áreas', unitSymbol: 'm²' },
			{ _id: '2', extractionKey: 'num_andenes', name: 'Andenes', categoryName: 'Andenes', unitSymbol: 'u' },
			{ _id: '3', extractionKey: 'num_empleados', name: 'Empleados', categoryName: 'Personal', unitSymbol: 'pax' }
		];
		const documents = [
			{
				fileName: 'rfp-demo.pdf',
				text: 'Area total construida: 12500 m2\nNumero de andenes de carga: 8\nRequisito adicional: cuarto de servidores con UPS'
			}
		];
		const r = await evaluateDemo({ checklist, documents });
		assert.equal(r.demoMode, true);
		assert.match(r.demoNotice, /ANTHROPIC_API_KEY/);
		assert.match(r.summary, /MODO DEMO/);
		assert.match(r.summary, /ANTHROPIC_API_KEY/);

		const area = r.findings.find((f) => f.extractionKey === 'area_total');
		assert.equal(area.status, 'encontrado');
		assert.equal(area.value, '12500');

		const andenes = r.findings.find((f) => f.extractionKey === 'num_andenes');
		assert.equal(andenes.status, 'encontrado');
		assert.equal(andenes.value, '8');

		const missing = r.findings.find((f) => f.extractionKey === 'num_empleados');
		assert.equal(missing.status, 'no_encontrado');

		assert.ok(r.additional.some((a) => /servidores/i.test(a.description)));
	});
});
