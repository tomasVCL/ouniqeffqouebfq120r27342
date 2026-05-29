import { getDb } from '../server/db.js';
import { startups, recommendations, clusters } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

const db = await getDb();
if (!db) {
  console.error('❌ DB unavailable');
  process.exit(1);
}

// 1. Buscar el cluster "Fulfillment Fintech & Última Milla Urbana" y remover boxful
const [fulfillmentCluster] = await db.select().from(clusters)
  .where(eq(clusters.name, 'Fulfillment Fintech & Última Milla Urbana'))
  .limit(1);

if (fulfillmentCluster) {
  const [boxful] = await db.select().from(startups).where(eq(startups.name, 'boxful')).limit(1);
  if (boxful && boxful.clusterId === fulfillmentCluster.id) {
    await db.update(startups).set({ clusterId: null }).where(eq(startups.id, boxful.id));
    console.log('✅ boxful removido del cluster "Fulfillment Fintech & Última Milla Urbana"');
  }
}

// 2. Actualizar la recomendación de Ravent (acortarla y omitir lo del piloto)
const [ravent] = await db.select().from(startups).where(eq(startups.name, 'Ravent')).limit(1);
if (ravent) {
  const newNarrative = "Ravent ingresa en el sexto lugar (WSM 9.25) con desempeño sobresaliente en 7 de 8 criterios. Su plataforma de fulfillment orchestration centraliza pedidos multi-canal, automatiza el flujo order-to-cash y coordina recursos de campo con routing inteligente, ETAs dinámicos y SLA monitoring. Su punto débil es la ausencia de certificaciones de seguridad documentadas (ISO 27001 / SOC 2), elemento crítico para el manejo de información bancaria sensible.";
  
  const [rec] = await db.select().from(recommendations)
    .where(eq(recommendations.startupId, ravent.id))
    .limit(1);
  
  if (rec) {
    await db.update(recommendations).set({ narrative: newNarrative }).where(eq(recommendations.id, rec.id));
    console.log('✅ Recomendación de Ravent actualizada: acortada y sin referencia al piloto');
  }
}

console.log('✅ Todos los cambios completados');
