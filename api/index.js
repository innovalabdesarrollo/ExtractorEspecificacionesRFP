/**
 * Entrada serverless Express para Vercel (mismo deploy que SvelteKit).
 * Rutas: /api/* y /uploads/*
 */
import serverless from 'serverless-http';
import { createApp } from '@extractor-rfp/api';
import { ensureApiReady } from '@extractor-rfp/api/ready';

let handler;

export default async function vercelHandler(req, res) {
	await ensureApiReady();
	if (!handler) {
		handler = serverless(createApp(), {
			binary: ['application/pdf', 'application/octet-stream', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/msword', 'application/vnd.ms-excel']
		});
	}
	return handler(req, res);
}
