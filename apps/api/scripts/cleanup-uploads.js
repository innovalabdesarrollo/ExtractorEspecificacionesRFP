import { connectDb, getDb, pingDb } from '../src/db.js';
import { cleanupOrphanUploads } from '../src/services/cleanupUploads.js';

await connectDb();
console.log(await pingDb());
const result = await cleanupOrphanUploads(getDb());
console.log('Limpieza uploads:', result);
process.exit(0);
