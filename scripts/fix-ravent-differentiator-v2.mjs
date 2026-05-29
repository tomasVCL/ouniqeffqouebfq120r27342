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
    keyDifferentiator: 'Ofrece un nivel sobresaliente de interacción y experiencia del cliente comunicación omnicanal, notificaciones automatizadas, puntos de contacto para cross-selling, educación financiera y activación de productos durante la entrega y formalización.'
  }).where(eq(startups.id, ravent.id));
  console.log('✅ Diferenciador clave de Ravent actualizado con texto completo');
} else {
  console.log('⚠️  Ravent no encontrado');
}
