/**
 * Update script — Grupo Purdy / Juan Diego González
 * Corrects and completes existing project data:
 *   - analystName (con acento en González)
 *   - requirement mandatory flags: 5 Indispensables, 2 Deseables
 *   - cluster colors: uno distinto por cluster
 *   - startup keyDifferentiator, strategicFit y clientsRef para los 12
 *
 * Run with: DATABASE_URL=<url> tsx scripts/update-purdy.ts
 */

import { eq } from "drizzle-orm";
import { getDb } from "../server/db.js";
import { projects, requirements, clusters, startups } from "../drizzle/schema.js";

if (!process.env.DATABASE_URL) {
  console.error("❌  DATABASE_URL not set.");
  process.exit(1);
}

const db = await getDb();
if (!db) { console.error("❌  DB unavailable"); process.exit(1); }

// ── Find project ───────────────────────────────────────────────────────────────
const [project] = await db.select().from(projects)
  .where(eq(projects.clientSlug, "purdy"))
  .limit(1);

if (!project) { console.error("❌  Project purdy not found"); process.exit(1); }
const projectId = project.id;
console.log(`✅  Found project ID ${projectId}`);

// ── 1. analystName ─────────────────────────────────────────────────────────────
await db.update(projects)
  .set({ analystName: "Juan Diego González" })
  .where(eq(projects.id, projectId));
console.log("  ✓ analystName → Juan Diego González");

// ── 2. Requirement mandatory flags ────────────────────────────────────────────
// Excel template v2 col F: 5 Indispensable = mandatory:true, 2 Deseable = mandatory:false
const MANDATORY_TRUE = new Set([
  "Generación de recurrencia e interacción frecuente",
  "Integración escalable con Purdy Go y sus verticales de movilidad",
  "Alineación al modelo de valor escalonado",
  "Captura y uso de datos de comportamiento",
  "Escalabilidad, conectividad y alianzas",
]);

const allReqs = await db.select().from(requirements)
  .where(eq(requirements.projectId, projectId));

for (const req of allReqs) {
  const shouldBe = MANDATORY_TRUE.has(req.name);
  await db.update(requirements)
    .set({ mandatory: shouldBe })
    .where(eq(requirements.id, req.id));
  const label = shouldBe ? "Indispensable" : "Deseable";
  console.log(`  ✓ ${label}: ${req.name}`);
}

// ── 3. Cluster colors ─────────────────────────────────────────────────────────
const CLUSTER_COLORS: Record<string, string> = {
  "Servicios de Movilidad On-Demand":   "#E67E22",  // naranja
  "Connected Car & Vehicle Data":        "#2980B9",  // azul
  "Loyalty, Engagement & Customer Data": "#27AE60",  // verde
};

const allClusters = await db.select().from(clusters)
  .where(eq(clusters.projectId, projectId));

for (const c of allClusters) {
  const color = CLUSTER_COLORS[c.name];
  if (color) {
    await db.update(clusters).set({ color }).where(eq(clusters.id, c.id));
    console.log(`  ✓ cluster color: ${c.name} → ${color}`);
  } else {
    console.warn(`  ⚠ No color mapping for cluster: "${c.name}"`);
  }
}

// ── 4. Startups: keyDifferentiator + strategicFit + clientsRef ────────────────
const STARTUP_DATA: Record<string, {
  keyDifferentiator: string;
  strategicFit: string;
  clientsRef: string;
}> = {
  "CAFU": {
    keyDifferentiator:
      "Movilidad energética bajo demanda con recurrencia natural, integración técnica madura vía Smartcar y captura de datos de comportamiento vehicular.",
    strategicFit:
      "Plataforma on-demand de entrega de combustible y cuidado del vehículo (lavado, cambio de aceite, ITV) a domicilio.",
    clientsRef: "Conductores particulares y flotas en EAU/KSA",
  },
  "Spiffy": {
    keyDifferentiator:
      "Servicios móviles de mantenimiento recurrente con software propietario (Mobile 360™) y dispositivos de diagnóstico (Easy Tread, Easy Flow) que generan datos accionables en cada intervención.",
    strategicFit:
      "Cuidado y mantenimiento móvil del vehículo on-demand (lavado, aceite, llantas) para consumidor y flotas, con captura de datos de servicio.",
    clientsRef: "Flotas corporativas, dealers y consumidores EE.UU.",
  },
  "Smartcar": {
    keyDifferentiator:
      "Capa de conectividad API compatible con +45 marcas que da acceso a datos reales del vehículo; clientes como Uber, Lyft y ev.energy.",
    strategicFit:
      "API de vehículo conectado OEM-agnóstica: acceso estandarizado a odómetro, ubicación, combustible/batería y comandos en +35 marcas.",
    clientsRef: "Insurtechs, EV charging, car-sharing, fintech auto",
  },
  "Mojio": {
    keyDifferentiator:
      "Telemetría vehicular con +20,000 millones de millas procesadas y alianzas con Amazon y T-Mobile; habilita servicios conectados vía API, SDK o app white-label.",
    strategicFit:
      "Plataforma de connected car para telcos y OEMs: telemetría en tiempo real, datos de comportamiento, alertas y servicios de valor agregado.",
    clientsRef: "Deutsche Telekom, T-Mobile, Amazon, Bell, KDDI",
  },
  "Sibros": {
    keyDifferentiator:
      "Deep Connected Platform para OTA, logging de datos CAN de alta resolución y comandos remotos; alianzas con Google Cloud y NXP e integración nativa con BigQuery.",
    strategicFit:
      "Deep Connected Platform: actualizaciones OTA, data logging granular y comandos remotos para todo el vehículo.",
    clientsRef: "OEMs de autos, motos y vehículos comerciales (global)",
  },
  "Vinli": {
    keyDifferentiator:
      "Plataforma de datos ERA que sintetiza fuentes OEM y GPS para analítica predictiva de movilidad; alianzas con Stellantis (Mobilisights) y Toyota Data Solutions.",
    strategicFit:
      "Plataforma de datos de vehículo conectado y mercado de apps/servicios de movilidad (seguros, mantenimiento, fleet).",
    clientsRef: "Aseguradoras, flotas y proveedores de servicios",
  },
  "Open Loyalty": {
    keyDifferentiator:
      "Plataforma de fidelización API-first con gamificación y modelos escalonados; reporta duplicación de la frecuencia de compra e integración profunda vía documentación abierta.",
    strategicFit:
      "Plataforma de fidelización headless / API-first: puntos, tiers, gamificación y recompensas integrables a cualquier stack.",
    clientsRef: "ALDI, JTI, U.S. Soccer, Equinix",
  },
  "EasyRewardz": {
    keyDifferentiator:
      "Suite de loyalty omnicanal que unifica interacciones online y offline en un perfil 360° y personaliza ofertas en tiempo real con DealCloud.",
    strategicFit:
      "Suite SaaS de loyalty y customer engagement omnicanal: tiers, CRM, campañas y analítica de comportamiento.",
    clientsRef: "Tata, Carlsberg, Marks & Spencer, Shoppers Stop",
  },
  "Antavo": {
    keyDifferentiator:
      "Loyalty Cloud enterprise con gamificación, programas escalonados y analítica con IA (Optimizer), integrable sin reingeniería; cita +30% CLTV y +22% en ingresos.",
    strategicFit:
      "Enterprise Loyalty Cloud no-code: tiers, automatización, gamificación y analítica de comportamiento.",
    clientsRef: "BMW, KFC, BENEFIT Cosmetics, LuisaViaRoma",
  },
  "Orbee": {
    keyDifferentiator:
      "CDP automotriz que integra datos de múltiples concesionarios, activa campañas por comportamiento y unifica identidad online/offline; madurez probada en grupos multi-rooftop.",
    strategicFit:
      "Customer Data Platform (CDP) automotriz con orquestación de marketing y advertising: unifica datos de múltiples fuentes del concesionario en un único perfil de cliente.",
    clientsRef: "Holman, Flow Automotive, Pohanka, Mills, Sam Pack (grupos de dealers)",
  },
  "Impel AI": {
    keyDifferentiator:
      "Motor de IA conversacional 24/7 que cubre todo el ciclo del cliente (dudas, recordatorios de mantenimiento, outreach de recompra) con +100 integraciones y presencia en +50 países.",
    strategicFit:
      "Plataforma de IA de engagement y ciclo de vida del cliente automotriz (ex-SpinCar): IA conversacional, datos de comportamiento del shopper e hiperpersonalización omnicanal.",
    clientsRef: "Concesionarios, OEMs y marketplaces en +50 países",
  },
  "myKaarma": {
    keyDifferentiator:
      "Plataforma de fixed ops con UX reconocida (citas, inspecciones digitales, pagos) presente en +1,800 concesionarios y partner oficial de Mercedes-Benz USA.",
    strategicFit:
      "Plataforma de comunicaciones, agendamiento, pagos e inspección en video para el service lane (fixed ops) de concesionarios.",
    clientsRef: "1,800+ concesionarios; partner de Mercedes-Benz USA",
  },
};

const allStartups = await db.select().from(startups)
  .where(eq(startups.projectId, projectId));

for (const s of allStartups) {
  const data = STARTUP_DATA[s.name];
  if (data) {
    await db.update(startups).set({
      keyDifferentiator: data.keyDifferentiator,
      strategicFit:      data.strategicFit,
      clientsRef:        data.clientsRef,
    }).where(eq(startups.id, s.id));
    console.log(`  ✓ keyDifferentiator + strategicFit + clientsRef: ${s.name}`);
  } else {
    console.warn(`  ⚠ No data for startup: ${s.name}`);
  }
}

console.log("\n✅  update-purdy.ts completed successfully.");
