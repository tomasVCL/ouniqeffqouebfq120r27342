/**
 * Seed script: WTS Peru DPP/LCA Scouting Project
 * Run: node seed-demo.mjs
 */
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
dotenv.config();

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

// Parse MySQL URL
function parseUrl(url) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: parseInt(u.port || "3306"),
    user: u.username,
    password: u.password,
    database: u.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
  };
}

const conn = await mysql.createConnection(parseUrl(DB_URL));
console.log("Connected to DB");

// ─── 1. Analyst credentials ───────────────────────────────────────────────
const [existing] = await conn.execute("SELECT id FROM analyst_credentials LIMIT 1");
if (existing.length === 0) {
  const hash = await bcrypt.hash("vclstudio2024", 12);
  await conn.execute("INSERT INTO analyst_credentials (username, passwordHash) VALUES (?, ?)", ["analyst", hash]);
  console.log("Created analyst credentials: analyst / vclstudio2024");
} else {
  console.log("Analyst credentials already exist");
}

// ─── 2. Project ───────────────────────────────────────────────────────────
const passkeyHash = await bcrypt.hash("wts2026", 10);
const [projResult] = await conn.execute(
  `INSERT INTO projects (title, clientName, industry, geoAllowed, geoExcluded, reportDate, analystName, analystEmail, passkeyHash, published, publishedAt)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    "Plataforma Escalable de DPP y LCA — WTS Peru",
    "World Textile Sourcing (WTS) Peru",
    "Textil / Sostenibilidad / DPP",
    "Unión Europea",
    "Reino Unido, LATAM (excepto pilotos)",
    "Mayo 2026",
    "Área de Innovación / Venture Clienting — VCL Studio",
    "innovacion@vclstudio.com",
    passkeyHash,
    true,
    new Date(),
  ]
);
const projectId = projResult.insertId;
console.log(`Created project id=${projectId}`);

// ─── 3. Requirements (WSM criteria) ──────────────────────────────────────
const requirements = [
  { name: "Madurez Tecnológica (TRL 7)", description: "Tecnología validada en entornos operativos reales (TRL ≥ 7)", weight: 15, category: "Must" },
  { name: "Experiencia en la Industria", description: "Casos de éxito comprobables con marcas de retail/textil", weight: 10, category: "Must" },
  { name: "Arquitectura Cloud y API-driven", description: "Infraestructura cloud nativa con APIs para integraciones ERP/PLM", weight: 10, category: "Should" },
  { name: "Escalabilidad y Seguridad", description: "Capacidad de escalar a nivel enterprise con seguridad robusta", weight: 10, category: "Should" },
  { name: "Sistemas Colaborativos", description: "Portal multi-actor para colaboración con proveedores", weight: 5, category: "Should" },
  { name: "Motor de LCA y Modelado", description: "Motor de cálculo de LCA certificado (PEF/ISO14040) a nivel de prenda", weight: 20, category: "Must" },
  { name: "Automatización de Datos ESG", description: "Automatización de flujos de datos ESG (CSRD, EUDR)", weight: 5, category: "Should" },
  { name: "IA y Analítica Avanzada", description: "Capacidades de IA para validación y análisis predictivo", weight: 5, category: "Should" },
  { name: "DPP (Digital Product Passport)", description: "Generación de Pasaporte Digital de Producto conforme a ESPR", weight: 20, category: "Must" },
];

const reqIds = [];
for (let i = 0; i < requirements.length; i++) {
  const r = requirements[i];
  const [res] = await conn.execute(
    "INSERT INTO requirements (projectId, name, description, weight, category, sortOrder) VALUES (?, ?, ?, ?, ?, ?)",
    [projectId, r.name, r.description, r.weight, r.category, i]
  );
  reqIds.push(res.insertId);
}
console.log(`Created ${reqIds.length} requirements`);

// ─── 4. Formula ───────────────────────────────────────────────────────────
const [formulaRes] = await conn.execute(
  "INSERT INTO formulas (projectId, name, expression, description) VALUES (?, ?, ?, ?)",
  [projectId, "Composite Score", "wsm * 0.5 + pugh_norm * 0.3 + capfit_avg * 0.2",
   "Puntaje compuesto: WSM (50%) + Pugh Normalizado (30%) + Capability Fit (20%)"]
);
const formulaId = formulaRes.insertId;
await conn.execute("INSERT INTO formula_variables (formulaId, name, description, defaultValue) VALUES (?, ?, ?, ?)", [formulaId, "wsm", "WSM Score (0-10)", 0]);
await conn.execute("INSERT INTO formula_variables (formulaId, name, description, defaultValue) VALUES (?, ?, ?, ?)", [formulaId, "pugh_norm", "Pugh Normalizado (0-10)", 0]);
await conn.execute("INSERT INTO formula_variables (formulaId, name, description, defaultValue) VALUES (?, ?, ?, ?)", [formulaId, "capfit_avg", "Capability Fit Promedio (0-10)", 0]);
console.log("Created formula");

// ─── 5. Clusters ─────────────────────────────────────────────────────────
const clusterDefs = [
  { name: "Tier 1 — Recomendados", description: "Startups con puntaje compuesto ≥ 9.0. Implementación inmediata recomendada.", color: "#22c55e" },
  { name: "Tier 2 — Potencial", description: "Puntaje 8.5–8.99. Candidatos para piloto o co-desarrollo.", color: "#f59e0b" },
  { name: "Tier 3 — Monitoreo", description: "Puntaje 7.0–8.49. Mantener en radar para próxima ronda.", color: "#f97316" },
  { name: "Tier 4 — Descartados", description: "Puntaje < 7.0. No cumplen criterios mínimos actuales.", color: "#ef4444" },
];
const clusterIds = [];
for (let i = 0; i < clusterDefs.length; i++) {
  const c = clusterDefs[i];
  const [res] = await conn.execute(
    "INSERT INTO clusters (projectId, name, description, color, sortOrder) VALUES (?, ?, ?, ?, ?)",
    [projectId, c.name, c.description, c.color, i]
  );
  clusterIds.push(res.insertId);
}
console.log(`Created ${clusterIds.length} clusters`);

// ─── 6. Startups ─────────────────────────────────────────────────────────
const startupDefs = [
  { name: "Carbonfact", hqCity: "París", hqCountry: "Francia", fundingStage: "Series A", tagline: "Motor de LCA automatizado para moda bajo estándares PEF e ISO14040 con integración ERP/PLM.", eligible: true, clusterId: clusterIds[0] },
  { name: "TrusTrace", hqCity: "Estocolmo", hqCountry: "Suecia", fundingStage: "Series B", tagline: "Plataforma de trazabilidad enterprise con arquitectura API-first y DPP conforme a ESPR.", eligible: true, clusterId: clusterIds[0] },
  { name: "Circularise", hqCity: "La Haya", hqCountry: "Países Bajos", fundingStage: "Series A", tagline: "DPP sobre Blockchain con Zero-Knowledge Proofs para privacidad de propiedad intelectual.", eligible: true, clusterId: clusterIds[1] },
  { name: "Fairly Made", hqCity: "París", hqCountry: "Francia", fundingStage: "Series A", tagline: "Trazabilidad y LCA a nivel de componente con interfaz colaborativa multi-proveedor.", eligible: true, clusterId: clusterIds[1] },
  { name: "Carbon Trail", hqCity: "Copenhague", hqCountry: "Dinamarca", fundingStage: "Seed", tagline: "LCAs rápidos impulsados por IA para retail con portal de engagement para proveedores.", eligible: true, clusterId: clusterIds[1] },
  { name: "Kezzler", hqCity: "Oslo", hqCountry: "Noruega", fundingStage: "Series A", tagline: "Serialización de alta velocidad e identidad digital única por unidad para DPP.", eligible: true, clusterId: clusterIds[1] },
  { name: "Ecochain", hqCity: "Ámsterdam", hqCountry: "Países Bajos", fundingStage: "Series A", tagline: "Software de LCA para manufactura compleja con análisis de cartera masiva de productos.", eligible: true, clusterId: clusterIds[2] },
  { name: "osapiens", hqCity: "Mannheim", hqCountry: "Alemania", fundingStage: "Series B", tagline: "Hub de cumplimiento normativo (CSRD, EUDR) con infraestructura cloud nativa para corporativos.", eligible: true, clusterId: clusterIds[2] },
  { name: "Myneral Labs", hqCity: "Londres", hqCountry: "Reino Unido", fundingStage: "Seed", tagline: "Trazabilidad blockchain de bajo costo para PYMES. Fuera de UE — riesgo regulatorio alto.", eligible: false, clusterId: clusterIds[3] },
  { name: "EcoVadis", hqCity: "París", hqCountry: "Francia", fundingStage: "Series B", tagline: "Evaluación ESG corporativa generalista. Sin granularidad para LCA por prenda individual.", eligible: false, clusterId: clusterIds[3] },
];
const startupIds = [];
for (let i = 0; i < startupDefs.length; i++) {
  const s = startupDefs[i];
  const [res] = await conn.execute(
    "INSERT INTO startups (projectId, name, hqCity, hqCountry, fundingStage, tagline, eligible, clusterId, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [projectId, s.name, s.hqCity, s.hqCountry, s.fundingStage, s.tagline, s.eligible ? 1 : 0, s.clusterId, i]
  );
  startupIds.push(res.insertId);
}
console.log(`Created ${startupIds.length} startups`);

// ─── 7. Capabilities ─────────────────────────────────────────────────────
const capDefs = [
  "Automated LCA Engine (Garment Level)",
  "Cloud Architecture & API Maturity",
  "TRL 7 Operational Readiness",
  "Multi-actor Collaborative Portal",
  "AI/ML Data Validation Capability",
  "EU-LAC Geographical Compliance",
  "ESG Data Automation Flow",
  "Digital Product Passport (DPP) Architecture",
];
const capIds = [];
for (let i = 0; i < capDefs.length; i++) {
  const [res] = await conn.execute(
    "INSERT INTO capabilities (projectId, name, sortOrder) VALUES (?, ?, ?)",
    [projectId, capDefs[i], i]
  );
  capIds.push(res.insertId);
}
console.log(`Created ${capIds.length} capabilities`);

// ─── 8. WSM Scores (Human) ────────────────────────────────────────────────
// Scores from the Excel: Carbonfact, TrusTrace, osapiens, Fairly Made, Carbonfact, Kezzler, Myneral Labs, Ecochain, Circularise, Carbon Trail
// Order matches startupIds: Carbonfact(0), TrusTrace(1), Circularise(2), Fairly Made(3), Carbon Trail(4), Kezzler(5), Ecochain(6), osapiens(7), Myneral Labs(8), EcoVadis(9)
// WSM scores per requirement (human):
// req order: TRL, Exp, Cloud, Scale, Collab, LCA, ESG, AI, DPP
const wsmHuman = {
  "Carbonfact":    [10, 9, 7, 8, 8, 2, 8, 5, 0],   // WSM=9.0
  "TrusTrace":     [10, 9, 9, 9, 10, 7, 8, 8, 9],  // WSM=8.6
  "Circularise":   [9, 7, 9, 10, 10, 8, 7, 7, 10], // WSM=8.95
  "Fairly Made":   [9, 10, 8, 9, 8, 9, 8, 7, 9],   // WSM=8.8
  "Carbon Trail":  [7.5, 8, 8, 10, 7, 8.5, 9, 9, 9], // WSM=8.475
  "Kezzler":       [10, 7, 9, 10, 7, 7, 9, 9, 10], // WSM=8.75
  "Ecochain":      [9, 7, 10, 9, 10, 10, 7, 7, 10],// WSM=8.7
  "osapiens":      [9, 7, 8, 8, 7, 10, 9, 9, 9],   // WSM=8.15
  "Myneral Labs":  [7, 5, 9, 6, 9, 8, 8, 7, 7],    // WSM=7.25
  "EcoVadis":      [10, 9, 8, 9, 8, 1, 0, 1, -1],  // WSM=5.45
};
const wsmAI = {
  "Carbonfact":    [9, 8, 9, 9, 8, 8, 9, 8, 9],
  "TrusTrace":     [10, 10, 9, 9, 10, 8, 9, 9, 9],
  "Circularise":   [8, 7, 9, 9, 9, 8, 7, 7, 10],
  "Fairly Made":   [9, 9, 8, 8, 8, 9, 8, 7, 8],
  "Carbon Trail":  [7, 8, 8, 8, 7, 8, 9, 8, 8],
  "Kezzler":       [9, 7, 9, 9, 7, 7, 8, 8, 9],
  "Ecochain":      [9, 7, 9, 9, 9, 9, 7, 8, 9],
  "osapiens":      [9, 8, 9, 9, 8, 7, 9, 9, 9],
  "Myneral Labs":  [6, 5, 7, 5, 7, 6, 6, 6, 6],
  "EcoVadis":      [8, 9, 8, 8, 8, 5, 8, 8, 5],
};
const startupNames = ["Carbonfact","TrusTrace","Circularise","Fairly Made","Carbon Trail","Kezzler","Ecochain","osapiens","Myneral Labs","EcoVadis"];
for (let si = 0; si < startupIds.length; si++) {
  const sName = startupNames[si];
  for (let ri = 0; ri < reqIds.length; ri++) {
    await conn.execute(
      "INSERT INTO wsm_scores (projectId, startupId, requirementId, humanScore, aiScore) VALUES (?, ?, ?, ?, ?)",
      [projectId, startupIds[si], reqIds[ri], wsmHuman[sName]?.[ri] ?? 5, wsmAI[sName]?.[ri] ?? 5]
    );
  }
}
console.log("Created WSM scores");

// ─── 9. Pugh Scores ──────────────────────────────────────────────────────
// From Excel Pugh Matrix: EcoVadis, TrusTrace, osapiens, Fairly Made, Carbonfact, Kezzler, Myneral Labs, Ecochain, Circularise, Carbon Trail
// Criteria: Geografía, TRL, Experiencia, Cloud, Escalabilidad, Colaborativos, LCA, ESG, IA, DPP
const pughHuman = {
  "Carbonfact":    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  "TrusTrace":     [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  "Circularise":   [1, 1, -1, 1, 1, 1, 1, 1, 1, 1],
  "Fairly Made":   [1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
  "Carbon Trail":  [1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
  "Kezzler":       [1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
  "Ecochain":      [1, 1, 0, 0, 1, 1, 1, 1, 1, 1],
  "osapiens":      [1, 1, 1, 1, 1, 1, 0, 1, 1, 1],
  "Myneral Labs":  [-1, 0, -1, 1, 0, 1, 1, 1, 1, 1],
  "EcoVadis":      [1, 1, 1, 1, 1, 1, -1, 0, 1, -1],
};
const pughAI = {
  "Carbonfact":    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  "TrusTrace":     [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  "Circularise":   [1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
  "Fairly Made":   [1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
  "Carbon Trail":  [1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
  "Kezzler":       [1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
  "Ecochain":      [1, 1, 0, 0, 1, 1, 1, 1, 1, 1],
  "osapiens":      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  "Myneral Labs":  [-1, 0, -1, 1, 0, 1, 0, 1, 1, 0],
  "EcoVadis":      [1, 1, 1, 1, 1, 1, -1, 0, 1, -1],
};
for (let si = 0; si < startupIds.length; si++) {
  const sName = startupNames[si];
  for (let ri = 0; ri < reqIds.length; ri++) {
    await conn.execute(
      "INSERT INTO pugh_scores (projectId, startupId, requirementId, humanScore, aiScore) VALUES (?, ?, ?, ?, ?)",
      [projectId, startupIds[si], reqIds[ri], pughHuman[sName]?.[ri] ?? 0, pughAI[sName]?.[ri] ?? 0]
    );
  }
}
console.log("Created Pugh scores");

// ─── 10. CapFit Scores ────────────────────────────────────────────────────
// From Excel: EcoVadis, TrusTrace, osapiens, Fairly Made, Carbonfact, Kezzler, Myneral Labs, Ecochain, Circularise, Carbon Trail
// Caps: LCA, Cloud, TRL, Collab, AI, Geo, ESG, DPP
const capfitHuman = {
  "Carbonfact":    ["High","High","Med","Med","High","High","High","High"],
  "TrusTrace":     ["High","High","Med","High","Med","High","High","High"],
  "Circularise":   ["High","High","Med","High","High","High","High","High"],
  "Fairly Made":   ["High","High","Med","High","Low","High","High","High"],
  "Carbon Trail":  ["High","High","Low","Med","High","High","High","High"],
  "Kezzler":       ["Med","High","High","Med","Med","High","High","High"],
  "Ecochain":      ["High","Med","Med","Low","High","High","High","High"],
  "osapiens":      ["Med","Med","Med","High","Med","High","High","High"],
  "Myneral Labs":  ["Low","High","Low","Med","Med","Low","High","High"],
  "EcoVadis":      ["Low","High","Med","High","High","High","Low","Low"],
};
const capfitAI = {
  "Carbonfact":    ["High","High","Med","Med","High","High","High","High"],
  "TrusTrace":     ["High","High","High","High","Med","High","High","High"],
  "Circularise":   ["High","High","Med","High","High","High","High","High"],
  "Fairly Made":   ["High","High","Med","High","Low","High","High","High"],
  "Carbon Trail":  ["High","High","Low","Med","High","High","High","High"],
  "Kezzler":       ["Med","High","High","Med","Med","High","High","High"],
  "Ecochain":      ["High","Med","Med","Low","High","High","High","High"],
  "osapiens":      ["Med","High","Med","High","High","High","High","High"],
  "Myneral Labs":  ["Low","High","Low","Med","Med","Low","High","High"],
  "EcoVadis":      ["Low","High","Med","High","High","High","Low","Low"],
};
for (let si = 0; si < startupIds.length; si++) {
  const sName = startupNames[si];
  for (let ci = 0; ci < capIds.length; ci++) {
    await conn.execute(
      "INSERT INTO capfit_scores (projectId, startupId, capabilityId, humanScore, aiScore) VALUES (?, ?, ?, ?, ?)",
      [projectId, startupIds[si], capIds[ci], capfitHuman[sName]?.[ci] ?? "Med", capfitAI[sName]?.[ci] ?? "Med"]
    );
  }
}
console.log("Created CapFit scores");

// ─── 11. Rankings ─────────────────────────────────────────────────────────
// From Final Matrix (Human): composite scores
const rankingData = [
  { name: "Carbonfact",   rank: 1, composite: 9.25, wsm: 9.0,   pugh: 10.0, capfit: 8.75,  tier: 1 },
  { name: "TrusTrace",    rank: 2, composite: 9.05, wsm: 8.6,   pugh: 10.0, capfit: 8.75,  tier: 1 },
  { name: "Circularise",  rank: 3, composite: 9.05, wsm: 8.95,  pugh: 9.0,  capfit: 9.375, tier: 1 },
  { name: "Fairly Made",  rank: 4, composite: 8.875,wsm: 8.8,   pugh: 9.5,  capfit: 8.125, tier: 2 },
  { name: "Carbon Trail", rank: 5, composite: 8.713,wsm: 8.475, pugh: 9.5,  capfit: 8.125, tier: 2 },
  { name: "Kezzler",      rank: 6, composite: 8.7,  wsm: 8.75,  pugh: 9.0,  capfit: 8.125, tier: 2 },
  { name: "Ecochain",     rank: 7, composite: 8.55, wsm: 8.7,   pugh: 9.0,  capfit: 7.5,   tier: 2 },
  { name: "osapiens",     rank: 8, composite: 8.425,wsm: 8.15,  pugh: 9.5,  capfit: 7.5,   tier: 2 },
  { name: "Myneral Labs", rank: 9, composite: 6.725,wsm: 7.25,  pugh: 7.0,  capfit: 5.0,   tier: 4 },
  { name: "EcoVadis",     rank: 10,composite: 6.1,  wsm: 5.45,  pugh: 7.5,  capfit: 5.625, tier: 4 },
];
for (const r of rankingData) {
  const si = startupNames.indexOf(r.name);
  if (si < 0) continue;
  await conn.execute(
    "INSERT INTO rankings (projectId, startupId, `rank`, compositeScore, wsmScore, pughNormalized, capfitAvg, tier) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [projectId, startupIds[si], r.rank, r.composite, r.wsm, r.pugh, r.capfit, r.tier]
  );
}
console.log("Created rankings");

// ─── 12. Recommendations ─────────────────────────────────────────────────
const recData = [
  {
    name: "Carbonfact",
    decision: "recommended",
    narrative: "Carbonfact se consolida como la opción idónea para el cálculo ambiental de WTS Peru. Su motor de LCA específico para moda bajo estándares PEF e ISO14040, combinado con integraciones directas con ERP/PLM, resuelve el cuello de botella del ingreso manual de datos. Con respaldo de Y Combinator y Alven, y clientes como Carhartt y New Balance, representa el menor riesgo técnico y comercial del universo evaluado. Puntaje compuesto: 9.25/10.",
    decisionReason: null,
  },
  {
    name: "TrusTrace",
    decision: "recommended",
    narrative: "TrusTrace es el estándar de oro en trazabilidad enterprise. Su ronda Series B de $30M y clientes globales como Adidas mitigan completamente el riesgo de ejecución a gran escala. La arquitectura API-first y el cumplimiento DPP (ESPR) la convierten en la solución más madura del mercado para los requisitos de WTS. Puntaje compuesto: 9.05/10.",
    decisionReason: null,
  },
  {
    name: "Circularise",
    decision: "recommended",
    narrative: "Circularise aporta un diferenciador único: privacidad mediante Zero-Knowledge Proofs en Blockchain. Esto resuelve el dolor crítico de convencer a proveedores de compartir información de origen sin revelar propiedad intelectual — un requisito implícito en cadenas textiles complejas. Altamente modular y escalable. Puntaje compuesto: 9.05/10.",
    decisionReason: null,
  },
  {
    name: "Fairly Made",
    decision: "recommended",
    narrative: "Fairly Made ofrece granularidad a nivel de componente para LCA y una interfaz colaborativa para mapear proveedores de múltiples niveles. Su respaldo de BNP Paribas y clientes como LVMH validan su posición en el mercado premium. Candidata para piloto de co-desarrollo. Puntaje: 8.875/10.",
    decisionReason: null,
  },
  {
    name: "Carbon Trail",
    decision: "recommended",
    narrative: "Carbon Trail destaca por su AI Copilot para recomendaciones de reducción de impacto y planeación de escenarios de descarbonización. Aunque en etapa Seed, su enfoque en LCAs rápidos para retail la hace relevante para proyectos piloto de menor escala. Puntaje: 8.713/10.",
    decisionReason: null,
  },
  {
    name: "Kezzler",
    decision: "recommended",
    narrative: "Kezzler es una pieza de infraestructura pura para DPP: serialización de alta velocidad e identidad digital única por unidad. Su especialización en unit-level traceability la hace complementaria a soluciones LCA. Puntaje: 8.7/10.",
    decisionReason: null,
  },
  {
    name: "Ecochain",
    decision: "recommended",
    narrative: "Ecochain es sólida para manufactura compleja con análisis de cartera masiva de productos (PCF). Su menor puntuación en CapFit refleja limitaciones en colaboración multi-actor, pero su motor de LCA industrial es de los más maduros. Monitoreo recomendado. Puntaje: 8.55/10.",
    decisionReason: null,
  },
  {
    name: "osapiens",
    decision: "recommended",
    narrative: "osapiens es el hub de cumplimiento normativo más robusto de Europa (CSRD, EUDR). Aunque su motor LCA es más básico que Carbonfact, asegura cero multas y una integración nativa muy fuerte con SAP. La IA la priorizó en su Top 3. Puntaje: 8.425/10.",
    decisionReason: null,
  },
  {
    name: "Myneral Labs",
    decision: "not_recommended",
    narrative: "Myneral Labs se descarta temporalmente por encontrarse en etapa Seed con TRL bajo y sede en Reino Unido (fuera de la UE), representando alto riesgo regulatorio para fondos de co-desarrollo europeos. Mantener en monitoreo para 2027. Puntaje: 6.725/10.",
    decisionReason: "trl",
  },
  {
    name: "EcoVadis",
    decision: "not_recommended",
    narrative: "EcoVadis se descarta por ser una evaluación ESG corporativa generalista, carente de la granularidad necesaria para calcular la huella ambiental por prenda individual. No resuelve el reto técnico central de WTS. Puntaje: 6.1/10.",
    decisionReason: "other",
  },
];
for (const r of recData) {
  const si = startupNames.indexOf(r.name);
  if (si < 0) continue;
  await conn.execute(
    "INSERT INTO recommendations (projectId, startupId, narrative, decision, decisionReason) VALUES (?, ?, ?, ?, ?)",
    [projectId, startupIds[si], r.narrative, r.decision, r.decisionReason]
  );
}
console.log("Created recommendations");

// ─── 13. Publish log ─────────────────────────────────────────────────────
await conn.execute(
  "INSERT INTO publish_log (projectId, action, publishedAt) VALUES (?, ?, ?)",
  [projectId, "published", new Date()]
);
console.log("Created publish log entry");

await conn.end();
console.log(`\n✅ Demo project seeded successfully!`);
console.log(`   Project ID: ${projectId}`);
console.log(`   Analyst login: analyst / vclstudio2024`);
console.log(`   Client passkey: wts2026`);
console.log(`   Client portal: /client/${projectId}`);
