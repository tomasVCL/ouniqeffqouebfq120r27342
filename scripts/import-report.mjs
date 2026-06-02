/**
 * Importador de reportes VCL Discover desde el template de Excel.
 *
 * Uso:
 *   node scripts/import-report.mjs \
 *     --file "ruta/al/VCL_Template_Evaluacion_Vendors.xlsx" \
 *     --slug purdy --problem 001 --passkey "CLAVE-DEL-CLIENTE" \
 *     [--industry "Movilidad"] [--geo-allowed "LATAM"] [--geo-excluded "—"]
 *
 * Es idempotente: si ya existe un proyecto con el mismo slug+problem, lo
 * reemplaza por completo (borra sus filas hijas y reinserta).
 *
 * Lee DATABASE_URL desde .env (o del entorno). Requiere TLS para TiDB Cloud.
 */
import "dotenv/config";
import xlsx from "xlsx";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

// ─── CLI args ───────────────────────────────────────────────────────────────
const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith("--")) args[a.slice(2)] = process.argv[++i];
}
const required = ["file", "slug", "problem", "passkey"];
for (const r of required) {
  if (!args[r]) { console.error(`Falta --${r}`); process.exit(1); }
}
if (!process.env.DATABASE_URL) { console.error("Falta DATABASE_URL"); process.exit(1); }

// ─── Helpers ─────────────────────────────────────────────────────────────────
const clean = (v) => (v == null ? null : String(v).replace(/\s+/g, " ").trim());
const norm = (v) => (v == null ? "" : String(v).replace(/\s+/g, " ").trim().toLowerCase());

function sheet(wb, namePart) {
  const name = wb.SheetNames.find((n) => n.includes(namePart));
  if (!name) throw new Error(`No se encontró la hoja que contenga "${namePart}"`);
  return xlsx.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: null });
}
function findRow(rows, predicate) {
  return rows.findIndex(predicate);
}
function labelValue(rows, label) {
  const row = rows.find((r) => r.some((c) => clean(c) === label));
  if (!row) return null;
  const idx = row.findIndex((c) => clean(c) === label);
  return clean(row[idx + 1]);
}

function mapFundingStage(raw) {
  const s = norm(raw);
  if (!s) return null;
  if (s.includes("pre-seed") || s.includes("preseed")) return "Pre-seed";
  if (/serie\s*c|series\s*c|growth|b\+/.test(s)) return "Series B+";
  if (/serie\s*b|series\s*b/.test(s)) return "Series B";
  if (/serie\s*a|series\s*a/.test(s)) return "Series A";
  if (s.includes("seed")) return "Seed";
  return null; // bootstrapped, profitable, etc. → sin etapa
}
function splitLocation(raw) {
  const s = clean(raw);
  if (!s) return { city: null, country: null };
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 1) return { city: null, country: parts[0] };
  return { city: parts[0], country: parts[parts.length - 1] };
}

// ─── Parse Excel ─────────────────────────────────────────────────────────────
const wb = xlsx.readFile(args.file);
const cfg = sheet(wb, "Configuración");
const perfiles = sheet(wb, "Perfiles");
const matriz = sheet(wb, "Matriz de Evaluación");

// A · Datos del proyecto
const project = {
  title: labelValue(cfg, "Proyecto") ?? "Reporte de Scouting",
  clientName: labelValue(cfg, "Cliente") ?? "Cliente",
  analystName: labelValue(cfg, "Analista"),
  reportDate: labelValue(cfg, "Fecha"),
  scopeDescription: labelValue(cfg, "Caso de uso / problema"),
};

// B · Umbrales de tier
const thrRow = cfg.find((r) => r.some((c) => /TOP PICK/i.test(String(c ?? ""))));
const thresholds = { top: 0.97, strong: 0.85, viable: 0.7 };
if (thrRow) {
  const nums = thrRow.filter((c) => typeof c === "number");
  if (nums.length >= 3) [thresholds.top, thresholds.strong, thresholds.viable] = nums;
}

// C · Requisitos
const reqHeader = findRow(cfg, (r) => r.some((c) => clean(c) === "Requisito (nombre corto)"));
const requirements = [];
for (let i = reqHeader + 1; i < cfg.length; i++) {
  const row = cfg[i];
  const name = clean(row[2]);
  const weight = row[4];
  if (!name || typeof weight !== "number") {
    if (requirements.length > 0) break; // fin de la sección
    continue;
  }
  requirements.push({ name, description: clean(row[3]), weight, sortOrder: requirements.length });
}

// D · Clusters
const cluHeader = findRow(cfg, (r) => r.some((c) => clean(c) === "Nombre del cluster"));
const clusters = [];
const CLUSTER_COLORS = ["#C0392B", "#2980B9", "#27AE60", "#8E44AD", "#E67E22", "#16A085"];
for (let i = cluHeader + 1; i < cfg.length; i++) {
  const row = cfg[i];
  const name = clean(row[2]);
  if (!name) { if (clusters.length > 0) break; else continue; }
  clusters.push({ name, description: clean(row[3]), color: CLUSTER_COLORS[clusters.length % CLUSTER_COLORS.length], sortOrder: clusters.length });
}

// E · Startups (nombre, cluster, síntesis = diferenciador)
const stHeader = findRow(cfg, (r) => clean(r[2]) === "Startup" && /cluster/i.test(String(r[3] ?? "")));
const startupBase = [];
for (let i = stHeader + 1; i < cfg.length; i++) {
  const row = cfg[i];
  const name = clean(row[2]);
  if (!name) { if (startupBase.length > 0) break; else continue; }
  startupBase.push({ name, clusterName: clean(row[3]), keyDifferentiator: clean(row[4]), sortOrder: startupBase.length });
}

// 02 · Perfiles — alineado por orden con startupBase
const perfHeader = findRow(perfiles, (r) => clean(r[2]) === "Descripción");
const profiles = [];
for (let i = perfHeader + 1; i < perfiles.length; i++) {
  const row = perfiles[i];
  if (row.every((c) => c == null)) continue;
  profiles.push(row);
}
startupBase.forEach((s, i) => {
  const p = profiles[i] ?? [];
  const loc = splitLocation(p[4]);
  s.description = clean(p[2]);
  s.foundedYear = typeof p[3] === "number" ? p[3] : null;
  s.hqCity = loc.city;
  s.hqCountry = loc.country;
  s.employeeRange = p[5] == null ? null : String(p[5]);
  s.clientsRef = clean(p[6]);
  s.fundingStage = mapFundingStage(p[7]);
  s.fundingAmount = clean(p[8]);
  s.investors = clean(p[9]);
  s.websiteUrl = clean(p[10]) ? (String(p[10]).startsWith("http") ? clean(p[10]) : "https://" + clean(p[10])) : null;
});

// 04 · Matriz — scores por startup × requisito
const matHeader = findRow(matriz, (r) => clean(r[1]) === "Startup");
const scores = [];
for (let i = matHeader + 1; i < matriz.length; i++) {
  const row = matriz[i];
  const startup = clean(row[1]);
  const requisito = clean(row[3]);
  const score = row[5];
  if (!startup || !requisito || typeof score !== "number") continue;
  scores.push({ startup, requisito, score, rationale: clean(row[7]) });
}

// ─── Cálculo de rankings ─────────────────────────────────────────────────────
const reqByNorm = new Map(requirements.map((r) => [norm(r.name), r]));
const weightSum = requirements.reduce((a, r) => a + r.weight, 0) || 1;
const perStartup = new Map();
for (const s of scores) {
  const req = reqByNorm.get(norm(s.requisito));
  if (!req) continue;
  if (!perStartup.has(s.startup)) perStartup.set(s.startup, { sum: 0 });
  perStartup.get(s.startup).sum += (s.score / 4) * req.weight;
}
const rankings = startupBase.map((s) => {
  const cumpl = (perStartup.get(s.name)?.sum ?? 0) / weightSum;
  const wsmScore = Math.round(cumpl * 1000) / 100; // 0–10, 2 decimales
  let tier = 4;
  if (cumpl >= thresholds.top) tier = 1;
  else if (cumpl >= thresholds.strong) tier = 2;
  else if (cumpl >= thresholds.viable) tier = 3;
  return { name: s.name, wsmScore, tier };
});
rankings.sort((a, b) => b.wsmScore - a.wsmScore);
rankings.forEach((r, i) => (r.rank = i + 1));

console.log(`\nParseado: ${requirements.length} criterios, ${clusters.length} clusters, ${startupBase.length} startups, ${scores.length} scores.`);
console.log("Ranking computado:");
rankings.forEach((r) => console.log(`  #${r.rank} ${r.name} — WSM ${r.wsmScore}/10 — Tier ${r.tier}`));

// ─── Inserción en DB ─────────────────────────────────────────────────────────
const conn = await mysql.createConnection({
  uri: process.env.DATABASE_URL,
  ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
});
await conn.beginTransaction();
try {
  // Borrar proyecto previo con el mismo slug+problem (idempotencia)
  const [existing] = await conn.query(
    "SELECT id FROM projects WHERE clientSlug = ? AND problemId = ?",
    [args.slug, args.problem]
  );
  for (const row of existing) {
    const pid = row.id;
    for (const tbl of ["wsm_scores", "rankings", "recommendations", "requirements", "startups", "clusters"]) {
      await conn.query(`DELETE FROM ${tbl} WHERE projectId = ?`, [pid]);
    }
    await conn.query("DELETE FROM projects WHERE id = ?", [pid]);
  }

  const passkeyHash = await bcrypt.hash(args.passkey, 10);
  const [projRes] = await conn.query(
    `INSERT INTO projects (title, clientName, industry, geoAllowed, geoExcluded, reportDate, analystName, scopeDescription, universeSize, eligibleCount, passkeyHash, clientSlug, problemId, published, publishedAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())`,
    [
      project.title, project.clientName, args.industry ?? null,
      args["geo-allowed"] ?? null, args["geo-excluded"] ?? null,
      project.reportDate, project.analystName, project.scopeDescription,
      startupBase.length, startupBase.length, passkeyHash,
      args.slug, args.problem, 1,
    ]
  );
  const projectId = projRes.insertId;

  // Clusters
  const clusterIdByName = new Map();
  for (const c of clusters) {
    const [r] = await conn.query(
      "INSERT INTO clusters (projectId, name, description, color, sortOrder) VALUES (?,?,?,?,?)",
      [projectId, c.name, c.description, c.color, c.sortOrder]
    );
    clusterIdByName.set(norm(c.name), r.insertId);
  }

  // Requirements
  const reqIdByName = new Map();
  for (const req of requirements) {
    const [r] = await conn.query(
      "INSERT INTO requirements (projectId, name, weight, mandatory, description, sortOrder) VALUES (?,?,?,?,?,?)",
      [projectId, req.name, req.weight, 0, req.description, req.sortOrder]
    );
    reqIdByName.set(norm(req.name), r.insertId);
  }

  // Startups
  const startupIdByName = new Map();
  for (const s of startupBase) {
    const [r] = await conn.query(
      `INSERT INTO startups (projectId, name, description, hqCity, hqCountry, foundedYear, fundingStage, employeeRange, eligible, keyDifferentiator, clientsRef, investors, fundingAmount, websiteUrl, clusterId, sortOrder)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        projectId, s.name, s.description, s.hqCity, s.hqCountry, s.foundedYear,
        s.fundingStage, s.employeeRange, 1, s.keyDifferentiator, s.clientsRef,
        s.investors, s.fundingAmount, s.websiteUrl,
        s.clusterName ? clusterIdByName.get(norm(s.clusterName)) ?? null : null,
        s.sortOrder,
      ]
    );
    startupIdByName.set(norm(s.name), r.insertId);
  }

  // WSM scores (0–4 del Excel → 0–10 almacenado)
  for (const sc of scores) {
    const sid = startupIdByName.get(norm(sc.startup));
    const rid = reqIdByName.get(norm(sc.requisito));
    if (!sid || !rid) continue;
    await conn.query(
      "INSERT INTO wsm_scores (projectId, startupId, requirementId, humanScore, rationale) VALUES (?,?,?,?,?)",
      [projectId, sid, rid, sc.score * 2.5, sc.rationale]
    );
  }

  // Rankings
  for (const rk of rankings) {
    const sid = startupIdByName.get(norm(rk.name));
    if (!sid) continue;
    await conn.query(
      "INSERT INTO rankings (projectId, startupId, `rank`, wsmScore, tier) VALUES (?,?,?,?,?)",
      [projectId, sid, rk.rank, rk.wsmScore, rk.tier]
    );
  }

  await conn.commit();
  console.log(`\n✅ Reporte importado. projectId=${projectId}`);
  console.log(`   URL: /${args.slug}/${args.problem}`);
  console.log(`   Passkey: ${args.passkey}`);
} catch (err) {
  await conn.rollback();
  console.error("\n❌ Error, rollback:", err);
  process.exitCode = 1;
} finally {
  await conn.end();
}
