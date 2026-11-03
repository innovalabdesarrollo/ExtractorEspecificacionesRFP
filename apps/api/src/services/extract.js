import fs from 'node:fs/promises';
import path from 'node:path';
import mammoth from 'mammoth';
import ExcelJS from 'exceljs';
import WordExtractor from 'word-extractor';
import { readXls } from 'xls-reader';
import { extractText, getDocumentProxy } from 'unpdf';

const wordExtractor = new WordExtractor();

function cellText(v) {
	if (v == null) return '';
	if (v instanceof Date) return v.toISOString().slice(0, 10);
	if (typeof v === 'object' && v.text) return String(v.text);
	return String(v);
}

/**
 * Extrae texto de un archivo RFP (pdf / word / excel, incl. legacy .doc / .xls).
 * Conserva referencia de origen (página / hoja cuando aplica).
 */
export async function extractFileText(absPath, fileType, fileName) {
	const ext = path.extname(fileName || absPath).toLowerCase() || path.extname(absPath).toLowerCase();
	try {
		if (fileType === 'pdf' || ext === '.pdf') {
			const buf = await fs.readFile(absPath);
			const pdf = await getDocumentProxy(new Uint8Array(buf));
			// Sin mergePages: un string por página → marcadores para sourceRef "página N"
			const result = await extractText(pdf, { mergePages: false });
			const pages = Array.isArray(result.text)
				? result.text.map((t) => String(t || ''))
				: [String(result.text || '')];
			const text = pages
				.map((t, i) => `--- Página ${i + 1} ---\n${t.trim()}`)
				.join('\n\n');
			return {
				ok: true,
				fileName,
				text,
				meta: { pages: result.totalPages || pages.length || pdf.numPages || null, type: 'pdf' }
			};
		}

		if (fileType === 'word' || ext === '.docx' || ext === '.doc') {
			if (ext === '.doc') {
				const doc = await wordExtractor.extract(absPath);
				const body = (doc.getBody && doc.getBody()) || '';
				const headers = (doc.getHeaders && doc.getHeaders({ includeFooters: true })) || '';
				const text = [body, headers].filter((t) => String(t || '').trim()).join('\n\n');
				return {
					ok: true,
					fileName,
					text,
					meta: { type: 'word', format: 'doc' }
				};
			}
			const buf = await fs.readFile(absPath);
			const result = await mammoth.extractRawText({ buffer: buf });
			return {
				ok: true,
				fileName,
				text: result.value || '',
				meta: { type: 'word', format: 'docx', messages: result.messages?.length || 0 }
			};
		}

		if (fileType === 'excel' || ext === '.xlsx' || ext === '.xls') {
			if (ext === '.xls') {
				const buf = await fs.readFile(absPath);
				const workbook = readXls(buf);
				const parts = [];
				const sheetNames = [];
				for (const sheet of workbook.sheets || []) {
					sheetNames.push(sheet.name);
					const rows = (sheet.rows || []).map((row) =>
						(row || []).map((c) => cellText(c)).join('\t')
					);
					parts.push(`--- Hoja: ${sheet.name} ---\n${rows.join('\n')}`);
				}
				return {
					ok: true,
					fileName,
					text: parts.join('\n\n'),
					meta: { type: 'excel', format: 'xls', sheets: sheetNames }
				};
			}
			const workbook = new ExcelJS.Workbook();
			await workbook.xlsx.readFile(absPath);
			const parts = [];
			const sheetNames = [];
			workbook.eachSheet((sheet) => {
				sheetNames.push(sheet.name);
				const rows = [];
				sheet.eachRow({ includeEmpty: false }, (row) => {
					const vals = row.values
						.slice(1)
						.map((v) => cellText(v));
					rows.push(vals.join('\t'));
				});
				parts.push(`--- Hoja: ${sheet.name} ---\n${rows.join('\n')}`);
			});
			return {
				ok: true,
				fileName,
				text: parts.join('\n\n'),
				meta: { type: 'excel', format: 'xlsx', sheets: sheetNames }
			};
		}
		return { ok: false, fileName, error: `Tipo no soportado: ${fileType || ext}`, text: '' };
	} catch (e) {
		const hint =
			ext === '.doc'
				? ' (Word legacy .doc)'
				: ext === '.xls'
					? ' (Excel legacy .xls)'
					: '';
		return {
			ok: false,
			fileName,
			error: `${e.message || 'Error al extraer texto'}${hint}`,
			text: ''
		};
	}
}
