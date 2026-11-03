import { MongoClient } from 'mongodb';

let client;
let db;

export async function connectDb() {
	const uri = process.env.MONGODB_URI;
	if (!uri) throw new Error('MONGODB_URI requerido en .env');

	client = new MongoClient(uri);
	await client.connect();
	db = client.db(); // nombre de DB viene de la URI
	if (!db.databaseName) throw new Error('La URI debe incluir el nombre de DB (/extractor_rfp_lintel)');
	return db;
}

export function getDb() {
	if (!db) throw new Error('DB no conectada');
	return db;
}

export async function pingDb() {
	const d = getDb();
	await d.command({ ping: 1 });
	return { dbName: d.databaseName, atlas: /mongodb\.net/.test(process.env.MONGODB_URI || '') };
}
