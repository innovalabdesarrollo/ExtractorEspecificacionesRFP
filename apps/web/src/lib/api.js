import { env } from '$env/dynamic/public';

/** Vacío / "same" = same-origin (Vercel). Local: definir PUBLIC_API_URL en .env */
function resolveBase() {
	const raw = env.PUBLIC_API_URL;
	if (raw === undefined || raw === null || raw === '' || raw === 'same') {
		if (typeof window !== 'undefined') return '';
		if (typeof process !== 'undefined' && process.env?.VERCEL_URL) {
			return `https://${process.env.VERCEL_URL}`;
		}
		return 'http://127.0.0.1:3052';
	}
	return String(raw).replace(/\/$/, '');
}

const BASE = resolveBase();

async function req(path, options = {}) {
	const res = await fetch(`${BASE}${path}`, options);
	const ct = res.headers.get('content-type') || '';
	const data = ct.includes('application/json') ? await res.json() : await res.text();
	if (!res.ok) {
		const msg = typeof data === 'object' && data?.error ? data.error : res.statusText;
		throw new Error(msg || 'Error de API');
	}
	return data;
}

export const api = {
	base: BASE,
	health: () => req('/api/health'),
	projects: {
		list: (params = {}) => {
			const q = new URLSearchParams(params).toString();
			return req(`/api/projects${q ? `?${q}` : ''}`);
		},
		get: (id) => req(`/api/projects/${id}`),
		create: (body) =>
			req('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
		patch: (id, body) =>
			req(`/api/projects/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			})
	},
	files: {
		list: (projectId) => req(`/api/files/project/${projectId}`),
		upload: async (projectId, fileList) => {
			const fd = new FormData();
			for (const f of fileList) fd.append('files', f);
			const res = await fetch(`${BASE}/api/files/project/${projectId}`, { method: 'POST', body: fd });
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				const err = new Error(data.error || res.statusText || 'Error al subir');
				err.code = data.code;
				err.rejected = data.rejected || [];
				err.accepted = data.accepted || [];
				throw err;
			}
			return data;
		},
		remove: (id) => req(`/api/files/${id}`, { method: 'DELETE' })
	},
	checklist: {
		categories: () => req('/api/checklist/categories'),
		createCategory: (body) =>
			req('/api/checklist/categories', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			}),
		patchCategory: (id, body) =>
			req(`/api/checklist/categories/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			}),
		units: () => req('/api/checklist/units'),
		createUnit: (body) =>
			req('/api/checklist/units', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			}),
		specs: (params = {}) => {
			const q = new URLSearchParams(params).toString();
			return req(`/api/checklist/specs${q ? `?${q}` : ''}`);
		},
		createSpec: (body) =>
			req('/api/checklist/specs', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			}),
		patchSpec: (id, body) =>
			req(`/api/checklist/specs/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			}),
		duplicateSpec: (id, name) =>
			req(`/api/checklist/specs/${id}/duplicate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name })
			}),
		validate: () => req('/api/checklist/validate'),
		changes: (params = {}) => {
			const q = new URLSearchParams(params).toString();
			return req(`/api/checklist/changes${q ? `?${q}` : ''}`);
		}
	},
	analyses: {
		list: (params = {}) => {
			const q = new URLSearchParams(params).toString();
			return req(`/api/analyses${q ? `?${q}` : ''}`);
		},
		get: (id) => req(`/api/analyses/${id}`),
		start: (projectId) => req(`/api/analyses/project/${projectId}`, { method: 'POST' }),
		compare: (projectId, a, b) => req(`/api/analyses/compare/${projectId}?a=${a}&b=${b}`),
		exportUrl: (id, { format = 'csv', architectural = false } = {}) =>
			`${BASE}/api/analyses/${id}/export?format=${format}${architectural ? '&architectural=1' : ''}`
	},
	observations: {
		list: (analysisId) => req(`/api/observations/analysis/${analysisId}`),
		create: (body) =>
			req('/api/observations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			}),
		patch: (id, body) =>
			req(`/api/observations/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			})
	}
};
