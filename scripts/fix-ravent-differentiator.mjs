import { getDb } from '../server/db.js';
import { startups } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

const db = await getDb();
if (!db) {
  console.error('❌ DB unavailable');
  process.exit(1);
}

const [ravent] = await db.select().from(startups).where(eq(startups.name, 'Ravent')).limit(1);
if (ravent) {
  await db.update(startups).set({
    keyDifferentiator: 'Ideal para cross-selling entre canales y ubicaciones.'
  }).where(eq(startups.id, ravent.id));
  console.log('✅ Diferenciador clave de Ravent actualizado');
} else {
  console.log('⚠️  Ravent no encontrado');
}
