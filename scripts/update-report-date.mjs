import { getDb } from '../server/db.js';
import { projects } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

const db = await getDb();
if (!db) {
  console.error('❌ DB unavailable');
  process.exit(1);
}

const [bac] = await db.select().from(projects).where(eq(projects.clientSlug, 'bac')).limit(1);
if (bac) {
  await db.update(projects).set({ reportDate: '01 Junio 2026' }).where(eq(projects.id, bac.id));
  console.log('✅ Fecha del reporte actualizada a "01 Junio 2026"');
} else {
  console.log('⚠️  Proyecto BAC no encontrado');
}
