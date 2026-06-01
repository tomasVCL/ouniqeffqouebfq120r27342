import { getDb } from '../server/db.js';
import { recommendations } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

const db = await getDb();
if (!db) {
  console.error('❌ DB unavailable');
  process.exit(1);
}

const oldNarrative = "FarEye obtiene el puntaje perfecto: cumple los 8 criterios al máximo nivel. Su tecnología geosmart convierte direcciones no estándar en smart codes (exactitud tipo Waze, requisito explícito del cliente), su herramienta Pilot reduce el tiempo humano de planificación de 10 horas a 60 minutos y su gestión de SLAs cubre tráfico, capacidad de vehículos y habilidades del conductor. Cuenta con certificaciones ISO 27001 + SOC 2 y experiencia con clientes como DHL, UPS y Walmart. Es la opción más completa de extremo a extremo para el problema de logística de entrega de tarjetas de BAC y se recomienda como proveedor principal para un piloto inmediato.";

const newNarrative = "FarEye obtiene el puntaje casi perfecto: cumple 7 criterios al máximo nivel. Su tecnología geosmart convierte direcciones no estándar en smart codes (exactitud tipo Waze, requisito explícito del cliente), su herramienta Pilot reduce el tiempo humano de planificación de 10 horas a 60 minutos y su gestión de SLAs cubre tráfico, capacidad de vehículos y habilidades del conductor. Cuenta con certificaciones ISO 27001 + SOC 2 y experiencia con clientes como DHL, UPS y Walmart. Es la opción más completa de extremo a extremo para el problema de logística de entrega de tarjetas de BAC y se recomienda como proveedor principal para un piloto inmediato.";

const [fareye] = await db.select().from(recommendations).where(eq(recommendations.narrative, oldNarrative)).limit(1);
if (fareye) {
  await db.update(recommendations).set({ narrative: newNarrative }).where(eq(recommendations.id, fareye.id));
  console.log('✅ Recomendación de FarEye actualizada: "puntaje perfecto" → "puntaje casi perfecto"');
} else {
  console.log('⚠️  Recomendación de FarEye no encontrada');
}
