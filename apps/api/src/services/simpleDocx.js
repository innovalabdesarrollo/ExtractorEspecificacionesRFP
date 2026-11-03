/**
 * DOCX mínimo (OOXML) sin dependencias — ZIP store + CRC32.
 */
import { deflateRawSync } from 'node:zlib';

function crc32(buf) {
	let c = ~0;
	for (let i = 0; i < buf.length; i++) {
		c ^= buf[i];
		for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
	}
	return ~c >>> 0;
}

function u16(n) {
	const b = Buffer.alloc(2);
	b.writeUInt16LE(n, 0);
	return b;
}
function u32(n) {
	const b = Buffer.alloc(4);
	b.writeUInt32LE(n >>> 0, 0);
	return b;
}

function zipStore(entries) {
	const parts = [];
	const central = [];
	let offset = 0;

	for (const { name, data } of entries) {
		const nameBuf = Buffer.from(name, 'utf8');
		const compressed = deflateRawSync(data);
		const crc = crc32(data);
		const local = Buffer.concat([
			u32(0x04034b50),
			u16(20),
			u16(0),
			u16(8), // deflate
			u16(0),
			u16(0),
			u32(crc),
			u32(compressed.length),
			u32(data.length),
			u16(nameBuf.length),
			u16(0),
			nameBuf,
			compressed
		]);
		central.push(
			Buffer.concat([
				u32(0x02014b50),
				u16(20),
				u16(20),
				u16(0),
				u16(8),
				u16(0),
				u16(0),
				u32(crc),
				u32(compressed.length),
				u32(data.length),
				u16(nameBuf.length),
				u16(0),
				u16(0),
				u16(0),
				u16(0),
				u32(0),
				u32(offset),
				nameBuf
			])
		);
		parts.push(local);
		offset += local.length;
	}

	const centralBuf = Buffer.concat(central);
	const end = Buffer.concat([
		u32(0x06054b50),
		u16(0),
		u16(0),
		u16(entries.length),
		u16(entries.length),
		u32(centralBuf.length),
		u32(offset),
		u16(0)
	]);
	return Buffer.concat([...parts, centralBuf, end]);
}

function escapeXml(s) {
	return String(s)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

export function buildSimpleDocx(paragraphs) {
	const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

	const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

	const body = paragraphs
		.map((p) => `<w:p><w:r><w:t xml:space="preserve">${escapeXml(p)}</w:t></w:r></w:p>`)
		.join('');

	const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${body}<w:sectPr/></w:body>
</w:document>`;

	return zipStore([
		{ name: '[Content_Types].xml', data: Buffer.from(contentTypes, 'utf8') },
		{ name: '_rels/.rels', data: Buffer.from(rels, 'utf8') },
		{ name: 'word/document.xml', data: Buffer.from(document, 'utf8') }
	]);
}
