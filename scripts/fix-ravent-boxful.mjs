import { getDb } from '../server/db.js';
import { startups, rankings, clusters } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

const db = await getDb();
if (!db) {
  console.error('❌ DB unavailable');
  process.exit(1);
}

// 1. Buscar Ravent y actualizar su descripción y diferenciador
const [ravent] = await db.select().from(startups).where(eq(startups.name, 'Ravent')).limit(1);
if (ravent) {
  await db.update(startups).set({
    description: 'Orquestación de fulfillment y gestión de órdenes multi-canal con automatización order-to-cash.',
    keyDifferentiator: 'Mejor para oportunidades de cross-selling entre canales y ubicaciones.'
  }).where(eq(startups.id, ravent.id));
  console.log('✅ Ravent actualizado: descripción acortada + diferenciador de cross-selling');
} else {
  console.log('⚠️  Ravent no encontrado');
}

// 2. Buscar Boxful y remover del ranking
const [boxful] = await db.select().from(startups).where(eq(startups.name, 'boxful')).limit(1);
if (boxful) {
  // Remover del ranking
  await db.delete(rankings).where(eq(rankings.startupId, boxful.id));
  console.log('✅ boxful removido del ranking');
  

  
  // Marcar como ineligible
  await db.update(startups).set({ eligible: false, excludedReason: 'Removido del análisis' }).where(eq(startups.id, boxful.id));
  console.log('✅ boxful marcado como ineligible');
} else {
  console.log('⚠️  boxful no encontrado');
}

console.log('✅ Todos los cambios completados');
