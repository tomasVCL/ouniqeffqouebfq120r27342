/**
 * Update script — Grupo Purdy / Juan Diego Gonzales
 * Updates existing project data with exact Excel values:
 *   - analystName, requirement mandatory flags,
 *     startup strategicFit and clientsRef fields.
 *
 * Run with: DATABASE_URL=<url> tsx scripts/update-purdy.ts
 */

// dotenv not needed — DATABASE_URL passed via env directly
import { eq } from "drizzle-orm";
import { getDb } from "../server/db.js";
import { projects, requirements, startups } from "../drizzle/schema.js";

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

// ── 1. Update analystName ──────────────────────────────────────────────────────
await db.update(projects)
  .set({ analystName: "Juan Diego Gonzales" })
  .where(eq(projects.id, projectId));
console.log("  ✓ analystName → Juan Diego Gonzales");

// ── 2. Update requirement mandatory flags ─────────────────────────────────────
const mandatoryTrue = [
  "Generación de recurrencia e interacción frecuente",
  "Integración escalable con Purdy Go y sus verticales de movilidad",
];

const allReqs = await db.select().from(requirements)
  .where(eq(requirements.projectId, projectId));

for (const req of allReqs) {
  const shouldBeMandatory = mandatoryTrue.includes(req.name);
  if (req.mandatory !== shouldBeMandatory) {
    await db.update(requirements)
      .set({ mandatory: shouldBeMandatory })
      .where(eq(requirements.id, req.id));
    console.log(`  ✓ mandatory=${shouldBeMandatory}: ${req.name}`);
  } else {
    console.log(`  — already correct (mandatory=${req.mandatory}): ${req.name}`);
  }
}

// ── 3. Update startup strategicFit + clientsRef ────────────────────────────────
const startupData: Record<string, { strategicFit: string; clientsRef: string }> = {
  "Open Loyalty": {
    strategicFit:
      "Plataforma de fidelización headless / API-first: puntos, tiers, gamificación y recompensas integrables a cualquier stack.",
    clientsRef: "ALDI, JTI, U.S. Soccer, Equinix",
  },
  "EasyRewardz": {
    strategicFit:
      "Suite SaaS de loyalty y customer engagement omnicanal: tiers, CRM, campañas y analítica de comportamiento.",
    clientsRef: "Tata, Carlsberg, Marks & Spencer, Shoppers Stop",
  },
  "Antavo": {
    strategicFit:
      "Enterprise Loyalty Cloud no-code: tiers, automatización, gamificación y analítica de comportamiento.",
    clientsRef: "BMW, KFC, BENEFIT Cosmetics, LuisaViaRoma",
  },
  "Orbee": {
    strategicFit:
      "Customer Data Platform (CDP) automotriz con orquestación de marketing y advertising: unifica datos de múltiples fuentes del concesionario en un único perfil de cliente.",
    clientsRef: "Holman, Flow Automotive, Pohanka, Mills, Sam Pack (grupos de dealers)",
  },
  "Impel AI": {
    strategicFit:
      "Plataforma de IA de engagement y ciclo de vida del cliente automotriz (ex-SpinCar): IA conversacional, datos de comportamiento del shopper e hiperpersonalización omnicanal.",
    clientsRef: "Concesionarios, OEMs y marketplaces en +50 países",
  },
  "myKaarma": {
    strategicFit:
      "Plataforma de comunicaciones, agendamiento, pagos e inspección en video para el service lane (fixed ops) de concesionarios.",
    clientsRef: "1,800+ concesionarios; partner de Mercedes-Benz USA",
  },
  "Smartcar": {
    strategicFit:
      "API de vehículo conectado OEM-agnóstica: acceso estandarizado a odómetro, ubicación, combustible/batería y comandos en +35 marcas.",
    clientsRef: "Insurtechs, EV charging, car-sharing, fintech auto",
  },
  "Mojio": {
    strategicFit:
      "Plataforma de connected car para telcos y OEMs: telemetría en tiempo real, datos de comportamiento, alertas y servicios de valor agregado.",
    clientsRef: "Deutsche Telekom, T-Mobile, Amazon, Bell, KDDI",
  },
  "Sibros": {
    strategicFit:
      "Deep Connected Platform: actualizaciones OTA, data logging granular y comandos remotos para todo el vehículo.",
    clientsRef: "OEMs de autos, motos y vehículos comerciales (global)",
  },
  "Vinli": {
    strategicFit:
      "Plataforma de datos de vehículo conectado y mercado de apps/servicios de movilidad (seguros, mantenimiento, fleet).",
    clientsRef: "Aseguradoras, flotas y proveedores de servicios",
  },
  "CAFU": {
    strategicFit:
      "Plataforma on-demand de entrega de combustible y cuidado del vehículo (lavado, cambio de aceite, ITV) a domicilio.",
    clientsRef: "Conductores particulares y flotas en EAU/KSA",
  },
  "Spiffy": {
    strategicFit:
      "Cuidado y mantenimiento móvil del vehículo on-demand (lavado, aceite, llantas) para consumidor y flotas, con captura de datos de servicio.",
    clientsRef: "Flotas corporativas, dealers y consumidores EE.UU.",
  },
};

const allStartups = await db.select().from(startups)
  .where(eq(startups.projectId, projectId));

for (const s of allStartups) {
  const data = startupData[s.name];
  if (data) {
    await db.update(startups)
      .set({ strategicFit: data.strategicFit, clientsRef: data.clientsRef })
      .where(eq(startups.id, s.id));
    console.log(`  ✓ strategicFit + clientsRef: ${s.name}`);
  } else {
    console.warn(`  ⚠ No data found for startup: ${s.name}`);
  }
}

console.log("\n✅  update-purdy.ts completed successfully.");
