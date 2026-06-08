// server/vercel.ts
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/routers.ts
import { TRPCError } from "@trpc/server";
import * as bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";

// server/_core/trpc.ts
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({ transformer: superjson });
var router = t.router;
var publicProcedure = t.procedure;

// server/_core/env.ts
var ENV = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-in-prod",
  isProduction: process.env.NODE_ENV === "production"
};

// server/db.ts
import { and, asc, desc, eq, gt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2";

// drizzle/schema.ts
import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
  boolean,
  tinyint
} from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var analystCredentials = mysqlTable("analyst_credentials", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 256 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  clientName: varchar("clientName", { length: 256 }).notNull(),
  industry: varchar("industry", { length: 128 }),
  geoAllowed: text("geoAllowed"),
  geoExcluded: text("geoExcluded"),
  reportDate: varchar("reportDate", { length: 32 }),
  analystName: varchar("analystName", { length: 128 }),
  analystEmail: varchar("analystEmail", { length: 320 }),
  analystPhone: varchar("analystPhone", { length: 64 }),
  scopeDescription: text("scopeDescription"),
  universeSize: int("universeSize"),
  eligibleCount: int("eligibleCount"),
  excludedCount: int("excludedCount"),
  passkeyHash: varchar("passkeyHash", { length: 256 }),
  clientLogoUrl: varchar("clientLogoUrl", { length: 512 }),
  clientSlug: varchar("clientSlug", { length: 64 }),
  problemId: varchar("problemId", { length: 16 }),
  briefingContent: text("briefingContent"),
  // JSON blob — problem report
  published: boolean("published").default(false).notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var requirements = mysqlTable("requirements", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  category: varchar("category", { length: 128 }),
  weight: float("weight").default(0).notNull(),
  mandatory: boolean("mandatory").default(false).notNull(),
  description: text("description"),
  evidence: text("evidence"),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var formulas = mysqlTable("formulas", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  type: mysqlEnum("type", ["Revenue", "Cost Savings", "Risk Reduction", "Time Savings"]).notNull(),
  expression: text("expression").notNull(),
  description: text("description"),
  result: float("result"),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var formulaVariables = mysqlTable("formula_variables", {
  id: int("id").autoincrement().primaryKey(),
  formulaId: int("formulaId").notNull(),
  name: varchar("name", { length: 64 }).notNull(),
  description: varchar("description", { length: 256 }),
  unit: varchar("unit", { length: 32 }),
  defaultValue: float("defaultValue").default(0).notNull()
});
var clusters = mysqlTable("clusters", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 32 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var startups = mysqlTable("startups", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  tagline: varchar("tagline", { length: 512 }),
  hqCity: varchar("hqCity", { length: 128 }),
  hqCountry: varchar("hqCountry", { length: 128 }),
  foundedYear: int("foundedYear"),
  fundingStage: mysqlEnum("fundingStage", ["Pre-seed", "Seed", "Series A", "Series B", "Series B+"]),
  trlLevel: tinyint("trlLevel"),
  employeeRange: varchar("employeeRange", { length: 64 }),
  eligible: boolean("eligible").default(true).notNull(),
  excludedReason: text("excludedReason"),
  strategicFit: text("strategicFit"),
  keyDifferentiator: text("keyDifferentiator"),
  clientsRef: varchar("clientsRef", { length: 512 }),
  investors: varchar("investors", { length: 512 }),
  fundingAmount: varchar("fundingAmount", { length: 64 }),
  description: varchar("description", { length: 512 }),
  websiteUrl: varchar("websiteUrl", { length: 512 }),
  clusterId: int("clusterId"),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var capabilities = mysqlTable("capabilities", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  sortOrder: int("sortOrder").default(0).notNull()
});
var wsmScores = mysqlTable("wsm_scores", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  startupId: int("startupId").notNull(),
  requirementId: int("requirementId").notNull(),
  humanScore: float("humanScore"),
  aiScore: float("aiScore"),
  justificationNote: text("justificationNote"),
  rationale: text("rationale"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var pughScores = mysqlTable("pugh_scores", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  startupId: int("startupId").notNull(),
  requirementId: int("requirementId").notNull(),
  humanScore: tinyint("humanScore"),
  // -1, 0, +1
  aiScore: tinyint("aiScore"),
  justificationNote: text("justificationNote"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var capfitScores = mysqlTable("capfit_scores", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  startupId: int("startupId").notNull(),
  capabilityId: int("capabilityId").notNull(),
  humanScore: mysqlEnum("humanScore", ["High", "Med", "Low"]),
  aiScore: mysqlEnum("aiScore", ["High", "Med", "Low"]),
  justificationNote: text("justificationNote"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var rankings = mysqlTable("rankings", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  startupId: int("startupId").notNull(),
  rank: int("rank"),
  compositeScore: float("compositeScore"),
  wsmScore: float("wsmScore"),
  pughNormalized: float("pughNormalized"),
  capfitAvg: float("capfitAvg"),
  tier: tinyint("tier"),
  // 1-4
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var recommendations = mysqlTable("recommendations", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  startupId: int("startupId").notNull(),
  aiDraft: text("aiDraft"),
  narrative: text("narrative"),
  decision: mysqlEnum("decision", ["recommended", "not_recommended"]),
  decisionReason: mysqlEnum("decisionReason", ["below_threshold", "geography", "trl", "other"]),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var clientFeedback = mysqlTable("client_feedback", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  section: varchar("section", { length: 64 }),
  // 'general' | 'criterion' | 'problem'
  requirementId: int("requirementId"),
  // nullable — for per-criterion feedback
  commentText: text("commentText").notNull(),
  suggestedWeight: float("suggestedWeight"),
  // nullable — 0.0 to 1.0
  authorName: varchar("authorName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var rateLimits = mysqlTable("rate_limits", {
  id: int("id").autoincrement().primaryKey(),
  ip: varchar("ip", { length: 45 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var publishLog = mysqlTable("publish_log", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  action: mysqlEnum("action", ["published", "unpublished"]).notNull(),
  publishedAt: timestamp("publishedAt").defaultNow().notNull()
});

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      const isLocal = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
      const pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        connectionLimit: 5,
        ...isLocal ? {} : { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true } }
      });
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function listProjects() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).orderBy(desc(projects.createdAt));
}
async function getProject(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result[0];
}
async function getProjectBySlug(clientSlug, problemId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(projects).where(and(eq(projects.clientSlug, clientSlug), eq(projects.problemId, problemId))).limit(1);
  return result[0];
}
async function getRequirements(projectId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(requirements).where(eq(requirements.projectId, projectId)).orderBy(asc(requirements.sortOrder));
}
async function getClusters(projectId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clusters).where(eq(clusters.projectId, projectId)).orderBy(asc(clusters.sortOrder));
}
async function getStartups(projectId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(startups).where(eq(startups.projectId, projectId)).orderBy(asc(startups.sortOrder));
}
async function getWsmScores(projectId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(wsmScores).where(eq(wsmScores.projectId, projectId));
}
async function getRankings(projectId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rankings).where(eq(rankings.projectId, projectId)).orderBy(asc(rankings.rank));
}
async function getRecommendations(projectId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(recommendations).where(eq(recommendations.projectId, projectId));
}
async function countRecentAttempts(ip, windowMinutes) {
  const db = await getDb();
  if (!db) return 0;
  const cutoff = new Date(Date.now() - windowMinutes * 60 * 1e3);
  const [row] = await db.select({ count: sql`COUNT(*)` }).from(rateLimits).where(and(eq(rateLimits.ip, ip), gt(rateLimits.createdAt, cutoff)));
  return Number(row?.count ?? 0);
}
async function insertAttempt(ip) {
  const db = await getDb();
  if (!db) return;
  await db.insert(rateLimits).values({ ip });
  const cutoff = new Date(Date.now() - 60 * 60 * 1e3);
  await db.delete(rateLimits).where(sql`${rateLimits.createdAt} < ${cutoff}`);
}
async function insertFeedback(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(clientFeedback).values(data);
}

// server/routers.ts
var secret = () => new TextEncoder().encode(ENV.jwtSecret);
async function signSession(projectId, clientSlug, problemId) {
  return new SignJWT({ sub: String(projectId), slug: clientSlug ?? "", pid: problemId ?? "" }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("24h").sign(secret());
}
async function verifySession(token) {
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      projectId: Number(payload.sub),
      slug: String(payload.slug ?? ""),
      pid: String(payload.pid ?? "")
    };
  } catch {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sesi\xF3n inv\xE1lida o expirada" });
  }
}
var RATE_LIMIT = 5;
var RATE_WINDOW_MIN = 15;
async function checkRateLimit(req) {
  const ip = String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim() || String(req.headers["x-real-ip"] ?? "") || "unknown";
  const attempts = await countRecentAttempts(ip, RATE_WINDOW_MIN);
  if (attempts >= RATE_LIMIT) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Demasiados intentos. Espera ${RATE_WINDOW_MIN} minutos e int\xE9ntalo de nuevo.`
    });
  }
  await insertAttempt(ip);
}
var appRouter = router({
  report: router({
    // Unified passkey login — rate-limited, returns a signed JWT session token
    resolvePasskey: publicProcedure.input(z.object({ passkey: z.string().max(128) })).mutation(async ({ input, ctx }) => {
      await checkRateLimit(ctx.req);
      const all = await listProjects();
      const published = all.filter((p) => p.published && p.passkeyHash);
      for (const p of published) {
        const valid = await bcrypt.compare(input.passkey, p.passkeyHash);
        if (valid) {
          const sessionToken = await signSession(p.id, p.clientSlug ?? null, p.problemId ?? null);
          return {
            clientSlug: p.clientSlug ?? null,
            problemId: p.problemId ?? null,
            projectId: p.id,
            sessionToken
          };
        }
      }
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Clave de acceso inv\xE1lida" });
    }),
    // Load report by clientSlug + problemId — requires valid JWT session token
    getBySlug: publicProcedure.input(z.object({ clientSlug: z.string(), problemId: z.string(), sessionToken: z.string() })).query(async ({ input }) => {
      const session = await verifySession(input.sessionToken);
      if (session.slug !== input.clientSlug || session.pid !== input.problemId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Sesi\xF3n no v\xE1lida para este reporte" });
      }
      const project = await getProjectBySlug(input.clientSlug, input.problemId);
      if (!project || !project.published) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reporte no encontrado" });
      }
      return buildReportPayload(project, project.id);
    }),
    // Legacy route /client/v2/:id — also requires JWT
    getByPasskey: publicProcedure.input(z.object({ projectId: z.number(), sessionToken: z.string() })).query(async ({ input }) => {
      const session = await verifySession(input.sessionToken);
      if (session.projectId !== input.projectId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Sesi\xF3n no v\xE1lida para este reporte" });
      }
      const project = await getProject(input.projectId);
      if (!project || !project.published) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reporte no encontrado o no publicado" });
      }
      return buildReportPayload(project, input.projectId);
    }),
    // Submit client feedback on the briefing
    submitFeedback: publicProcedure.input(z.object({
      sessionToken: z.string(),
      projectId: z.number(),
      authorName: z.string().max(255).optional(),
      items: z.array(z.object({
        section: z.string().max(64),
        requirementId: z.number().optional(),
        commentText: z.string().max(4e3),
        suggestedWeight: z.number().min(0).max(1).optional()
      })).min(1).max(50)
    })).mutation(async ({ input }) => {
      const session = await verifySession(input.sessionToken);
      if (session.projectId !== input.projectId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Sesi\xF3n no v\xE1lida" });
      }
      for (const item of input.items) {
        await insertFeedback({
          projectId: input.projectId,
          section: item.section,
          requirementId: item.requirementId ?? null,
          commentText: item.commentText,
          suggestedWeight: item.suggestedWeight ?? null,
          authorName: input.authorName ?? null
        });
      }
      return { ok: true };
    }),
    // List published projects (passkey entry page — public)
    listPublished: publicProcedure.query(async () => {
      const all = await listProjects();
      return all.filter((p) => p.published).map((p) => ({
        id: p.id,
        title: p.title,
        clientName: p.clientName,
        industry: p.industry,
        publishedAt: p.publishedAt
      }));
    })
  })
});
async function buildReportPayload(project, projectId) {
  const [reqs, clusterList, startupList, wsmList, rankingList, recList] = await Promise.all([
    getRequirements(projectId),
    getClusters(projectId),
    getStartups(projectId),
    getWsmScores(projectId),
    getRankings(projectId),
    getRecommendations(projectId)
  ]);
  return {
    project: {
      id: project.id,
      title: project.title,
      clientName: project.clientName,
      industry: project.industry,
      geoAllowed: project.geoAllowed,
      geoExcluded: project.geoExcluded,
      reportDate: project.reportDate,
      analystName: project.analystName,
      // analystEmail and analystPhone intentionally omitted (internal data)
      scopeDescription: project.scopeDescription,
      universeSize: project.universeSize,
      eligibleCount: project.eligibleCount,
      excludedCount: project.excludedCount,
      publishedAt: project.publishedAt,
      clientLogoUrl: project.clientLogoUrl,
      clientSlug: project.clientSlug,
      problemId: project.problemId,
      briefingContent: project.briefingContent ?? null
    },
    requirements: reqs,
    clusters: clusterList,
    startups: startupList,
    wsmScores: wsmList,
    rankings: rankingList,
    recommendations: recList
  };
}

// server/_core/context.ts
async function createContext(opts) {
  return { req: opts.req, res: opts.res };
}

// server/vercel.ts
var ALLOWED_ORIGINS = [
  "https://vclstudio-scouting-platform.vercel.app",
  "http://localhost:3000",
  "http://localhost:3200"
];
function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
}
var app = express();
app.use(corsMiddleware);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));
app.use(
  "/api/trpc",
  createExpressMiddleware({ router: appRouter, createContext })
);
var vercel_default = app;
export {
  vercel_default as default
};
