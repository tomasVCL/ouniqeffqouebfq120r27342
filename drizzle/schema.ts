import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
  boolean,
  tinyint,
} from "drizzle-orm/mysql-core";

// ─── Core user table (Manus OAuth — kept for system use) ───────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Analyst credentials (shared team login) ──────────────────────────────
export const analystCredentials = mysqlTable("analyst_credentials", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 256 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalystCredential = typeof analystCredentials.$inferSelect;

// ─── Projects ─────────────────────────────────────────────────────────────
export const projects = mysqlTable("projects", {
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
  briefingContent: text("briefingContent"),   // JSON blob — problem report
  published: boolean("published").default(false).notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// ─── Requirements (Step B) ─────────────────────────────────────────────────
export const requirements = mysqlTable("requirements", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Requirement = typeof requirements.$inferSelect;
export type InsertRequirement = typeof requirements.$inferInsert;

// ─── Formulas (Step C) ────────────────────────────────────────────────────
export const formulas = mysqlTable("formulas", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  type: mysqlEnum("type", ["Revenue", "Cost Savings", "Risk Reduction", "Time Savings"]).notNull(),
  expression: text("expression").notNull(),
  description: text("description"),
  result: float("result"),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Formula = typeof formulas.$inferSelect;
export type InsertFormula = typeof formulas.$inferInsert;

export const formulaVariables = mysqlTable("formula_variables", {
  id: int("id").autoincrement().primaryKey(),
  formulaId: int("formulaId").notNull(),
  name: varchar("name", { length: 64 }).notNull(),
  description: varchar("description", { length: 256 }),
  unit: varchar("unit", { length: 32 }),
  defaultValue: float("defaultValue").default(0).notNull(),
});

export type FormulaVariable = typeof formulaVariables.$inferSelect;
export type InsertFormulaVariable = typeof formulaVariables.$inferInsert;

// ─── Clusters (Step E) ────────────────────────────────────────────────────
export const clusters = mysqlTable("clusters", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
    name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 32 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Cluster = typeof clusters.$inferSelect;
export type InsertCluster = typeof clusters.$inferInsert;

// ─── Startups (Step D) ────────────────────────────────────────────────────
export const startups = mysqlTable("startups", {
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Startup = typeof startups.$inferSelect;
export type InsertStartup = typeof startups.$inferInsert;

// ─── Capabilities (for Step H) ────────────────────────────────────────────
export const capabilities = mysqlTable("capabilities", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  sortOrder: int("sortOrder").default(0).notNull(),
});

export type Capability = typeof capabilities.$inferSelect;
export type InsertCapability = typeof capabilities.$inferInsert;

// ─── WSM Scores (Step F) ──────────────────────────────────────────────────
export const wsmScores = mysqlTable("wsm_scores", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  startupId: int("startupId").notNull(),
  requirementId: int("requirementId").notNull(),
  humanScore: float("humanScore"),
  aiScore: float("aiScore"),
  justificationNote: text("justificationNote"),
  rationale: text("rationale"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type WsmScore = typeof wsmScores.$inferSelect;

// ─── Pugh Scores (Step G) ─────────────────────────────────────────────────
export const pughScores = mysqlTable("pugh_scores", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  startupId: int("startupId").notNull(),
  requirementId: int("requirementId").notNull(),
  humanScore: tinyint("humanScore"),   // -1, 0, +1
  aiScore: tinyint("aiScore"),
  justificationNote: text("justificationNote"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PughScore = typeof pughScores.$inferSelect;

// ─── CapFit Scores (Step H) ───────────────────────────────────────────────
export const capfitScores = mysqlTable("capfit_scores", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  startupId: int("startupId").notNull(),
  capabilityId: int("capabilityId").notNull(),
  humanScore: mysqlEnum("humanScore", ["High", "Med", "Low"]),
  aiScore: mysqlEnum("aiScore", ["High", "Med", "Low"]),
  justificationNote: text("justificationNote"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CapfitScore = typeof capfitScores.$inferSelect;

// ─── Rankings (Step J) ────────────────────────────────────────────────────
export const rankings = mysqlTable("rankings", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  startupId: int("startupId").notNull(),
  rank: int("rank"),
  compositeScore: float("compositeScore"),
  wsmScore: float("wsmScore"),
  pughNormalized: float("pughNormalized"),
  capfitAvg: float("capfitAvg"),
  tier: tinyint("tier"),  // 1-4
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Ranking = typeof rankings.$inferSelect;

// ─── Recommendations (Step K) ─────────────────────────────────────────────
export const recommendations = mysqlTable("recommendations", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  startupId: int("startupId").notNull(),
  aiDraft: text("aiDraft"),
  narrative: text("narrative"),
  decision: mysqlEnum("decision", ["recommended", "not_recommended"]),
  decisionReason: mysqlEnum("decisionReason", ["below_threshold", "geography", "trl", "other"]),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Recommendation = typeof recommendations.$inferSelect;

// ─── Client Feedback ──────────────────────────────────────────────────────────
export const clientFeedback = mysqlTable("client_feedback", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  section: varchar("section", { length: 64 }),        // 'general' | 'criterion' | 'problem'
  requirementId: int("requirementId"),                  // nullable — for per-criterion feedback
  commentText: text("commentText").notNull(),
  suggestedWeight: float("suggestedWeight"),             // nullable — 0.0 to 1.0
  authorName: varchar("authorName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClientFeedback = typeof clientFeedback.$inferSelect;
export type InsertClientFeedback = typeof clientFeedback.$inferInsert;

// ─── Rate Limits ──────────────────────────────────────────────────────────────
export const rateLimits = mysqlTable("rate_limits", {
  id: int("id").autoincrement().primaryKey(),
  ip: varchar("ip", { length: 45 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Publish Log (Step L) ─────────────────────────────────────────────────
export const publishLog = mysqlTable("publish_log", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  action: mysqlEnum("action", ["published", "unpublished"]).notNull(),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
});

export type PublishLog = typeof publishLog.$inferSelect;
