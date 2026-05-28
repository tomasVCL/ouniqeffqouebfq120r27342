import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, analystCredentials, projects, requirements, formulas, formulaVariables, clusters, startups, capabilities, wsmScores, pughScores, capfitScores, rankings, recommendations, publishLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users (Manus OAuth) ──────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach(field => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = 'admin';
    updateSet.role = 'admin';
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Analyst Credentials ──────────────────────────────────────────────────
export async function getAnalystByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(analystCredentials).where(eq(analystCredentials.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAnalystCredential(username: string, passwordHash: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(analystCredentials).values({ username, passwordHash });
}

export async function analystCredentialExists(): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: analystCredentials.id }).from(analystCredentials).limit(1);
  return result.length > 0;
}

// ─── Projects ─────────────────────────────────────────────────────────────
export async function listProjects() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).orderBy(desc(projects.createdAt));
}

export async function getProject(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result[0];
}

export async function createProject(data: Omit<typeof projects.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(projects).values(data as typeof projects.$inferInsert).$returningId();
  return result.id;
}

export async function updateProject(id: number, data: Partial<typeof projects.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(projects).set(data).where(eq(projects.id, id));
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(projects).where(eq(projects.id, id));
}

export async function getProjectBySlug(clientSlug: string, problemId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(projects)
    .where(and(eq(projects.clientSlug, clientSlug), eq(projects.problemId, problemId)))
    .limit(1);
  return result[0];
}

// ─── Requirements ─────────────────────────────────────────────────────────
export async function getRequirements(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(requirements).where(eq(requirements.projectId, projectId)).orderBy(asc(requirements.sortOrder));
}

export async function upsertRequirement(data: typeof requirements.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  if (data.id) {
    await db.update(requirements).set(data).where(eq(requirements.id, data.id));
    return data.id;
  } else {
    const [result] = await db.insert(requirements).values(data).$returningId();
    return result.id;
  }
}

export async function deleteRequirement(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(requirements).where(eq(requirements.id, id));
}

// ─── Formulas ─────────────────────────────────────────────────────────────
export async function getFormulas(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  const fList = await db.select().from(formulas).where(eq(formulas.projectId, projectId)).orderBy(asc(formulas.sortOrder));
  if (fList.length === 0) return [];
  const allVars = await db.select().from(formulaVariables).where(inArray(formulaVariables.formulaId, fList.map(f => f.id)));
  const varsByFormula = new Map<number, typeof allVars>();
  for (const v of allVars) {
    if (!varsByFormula.has(v.formulaId)) varsByFormula.set(v.formulaId, []);
    varsByFormula.get(v.formulaId)!.push(v);
  }
  return fList.map(f => ({ ...f, variables: varsByFormula.get(f.id) ?? [] }));
}

export async function upsertFormula(data: typeof formulas.$inferInsert) {
  const db = await getDb();
  if (!db) return 0;
  if (data.id) {
    await db.update(formulas).set(data).where(eq(formulas.id, data.id));
    return data.id;
  } else {
    const [result] = await db.insert(formulas).values(data).$returningId();
    return result.id;
  }
}

export async function deleteFormula(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(formulaVariables).where(eq(formulaVariables.formulaId, id));
  await db.delete(formulas).where(eq(formulas.id, id));
}

export async function upsertFormulaVariable(data: typeof formulaVariables.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  if (data.id) {
    await db.update(formulaVariables).set(data).where(eq(formulaVariables.id, data.id));
  } else {
    await db.insert(formulaVariables).values(data);
  }
}

export async function deleteFormulaVariable(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(formulaVariables).where(eq(formulaVariables.id, id));
}

export async function replaceFormulaVariables(formulaId: number, vars: Array<{ name: string; description?: string; unit?: string; defaultValue?: number; value?: number }>) {
  const db = await getDb();
  if (!db) return;
  await db.delete(formulaVariables).where(eq(formulaVariables.formulaId, formulaId));
  if (vars.length > 0) {
    await db.insert(formulaVariables).values(vars.map(v => ({ formulaId, name: v.name, description: v.description, unit: v.unit, defaultValue: v.defaultValue ?? v.value ?? 0 })));
  }
}

// ─── Clusters ─────────────────────────────────────────────────────────────
export async function getClusters(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clusters).where(eq(clusters.projectId, projectId)).orderBy(asc(clusters.sortOrder));
}

export async function upsertCluster(data: typeof clusters.$inferInsert) {
  const db = await getDb();
  if (!db) return 0;
  if (data.id) {
    await db.update(clusters).set(data).where(eq(clusters.id, data.id));
    return data.id;
  } else {
    const [result] = await db.insert(clusters).values(data).$returningId();
    return result.id;
  }
}

export async function deleteCluster(id: number) {
  const db = await getDb();
  if (!db) return;
  // unassign startups from this cluster
  await db.update(startups).set({ clusterId: null }).where(eq(startups.clusterId, id));
  await db.delete(clusters).where(eq(clusters.id, id));
}

// ─── Startups ─────────────────────────────────────────────────────────────
export async function getStartups(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(startups).where(eq(startups.projectId, projectId)).orderBy(asc(startups.sortOrder));
}

export async function upsertStartup(data: typeof startups.$inferInsert) {
  const db = await getDb();
  if (!db) return 0;
  if (data.id) {
    await db.update(startups).set(data).where(eq(startups.id, data.id));
    return data.id;
  } else {
    const [result] = await db.insert(startups).values(data).$returningId();
    return result.id;
  }
}

export async function deleteStartup(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(startups).where(eq(startups.id, id));
}

// ─── Capabilities ─────────────────────────────────────────────────────────
export async function getCapabilities(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(capabilities).where(eq(capabilities.projectId, projectId)).orderBy(asc(capabilities.sortOrder));
}

export async function upsertCapability(data: typeof capabilities.$inferInsert) {
  const db = await getDb();
  if (!db) return 0;
  if (data.id) {
    await db.update(capabilities).set(data).where(eq(capabilities.id, data.id));
    return data.id;
  } else {
    const [result] = await db.insert(capabilities).values(data).$returningId();
    return result.id;
  }
}

export async function deleteCapability(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(capabilities).where(eq(capabilities.id, id));
}

// ─── WSM Scores ───────────────────────────────────────────────────────────
export async function getWsmScores(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(wsmScores).where(eq(wsmScores.projectId, projectId));
}

export async function upsertWsmScore(data: { projectId: number; startupId: number; requirementId: number; humanScore?: number | null; aiScore?: number | null; justificationNote?: string | null; rationale?: string | null }) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(wsmScores).where(and(eq(wsmScores.projectId, data.projectId), eq(wsmScores.startupId, data.startupId), eq(wsmScores.requirementId, data.requirementId))).limit(1);
  if (existing.length > 0) {
    await db.update(wsmScores).set(data).where(eq(wsmScores.id, existing[0].id));
  } else {
    await db.insert(wsmScores).values(data);
  }
}

// ─── Pugh Scores ──────────────────────────────────────────────────────────
export async function getPughScores(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pughScores).where(eq(pughScores.projectId, projectId));
}

export async function upsertPughScore(data: { projectId: number; startupId: number; requirementId: number; humanScore?: number | null; aiScore?: number | null; justificationNote?: string | null }) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(pughScores).where(and(eq(pughScores.projectId, data.projectId), eq(pughScores.startupId, data.startupId), eq(pughScores.requirementId, data.requirementId))).limit(1);
  if (existing.length > 0) {
    await db.update(pughScores).set(data).where(eq(pughScores.id, existing[0].id));
  } else {
    await db.insert(pughScores).values(data);
  }
}

// ─── CapFit Scores ────────────────────────────────────────────────────────
export async function getCapfitScores(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(capfitScores).where(eq(capfitScores.projectId, projectId));
}

export async function upsertCapfitScore(data: { projectId: number; startupId: number; capabilityId: number; humanScore?: "High" | "Med" | "Low" | null; aiScore?: "High" | "Med" | "Low" | null; justificationNote?: string | null }) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(capfitScores).where(and(eq(capfitScores.projectId, data.projectId), eq(capfitScores.startupId, data.startupId), eq(capfitScores.capabilityId, data.capabilityId))).limit(1);
  if (existing.length > 0) {
    await db.update(capfitScores).set(data).where(eq(capfitScores.id, existing[0].id));
  } else {
    await db.insert(capfitScores).values(data);
  }
}

// ─── Rankings ─────────────────────────────────────────────────────────────
export async function getRankings(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rankings).where(eq(rankings.projectId, projectId)).orderBy(asc(rankings.rank));
}

export async function upsertRanking(data: typeof rankings.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(rankings).where(and(eq(rankings.projectId, data.projectId!), eq(rankings.startupId, data.startupId!))).limit(1);
  if (existing.length > 0) {
    await db.update(rankings).set(data).where(eq(rankings.id, existing[0].id));
  } else {
    await db.insert(rankings).values(data);
  }
}

// ─── Recommendations ──────────────────────────────────────────────────────
export async function getRecommendations(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(recommendations).where(eq(recommendations.projectId, projectId));
}

export async function upsertRecommendation(data: typeof recommendations.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(recommendations).where(and(eq(recommendations.projectId, data.projectId!), eq(recommendations.startupId, data.startupId!))).limit(1);
  if (existing.length > 0) {
    await db.update(recommendations).set(data).where(eq(recommendations.id, existing[0].id));
  } else {
    await db.insert(recommendations).values(data);
  }
}

// ─── Publish Log ──────────────────────────────────────────────────────────
export async function getPublishLog(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(publishLog).where(eq(publishLog.projectId, projectId)).orderBy(desc(publishLog.publishedAt));
}

export async function addPublishLog(projectId: number, action: "published" | "unpublished") {
  const db = await getDb();
  if (!db) return;
  await db.insert(publishLog).values({ projectId, action });
}

// ─── Report (Client Portal) ───────────────────────────────────────────────
export async function getPublishedProjectByPasskeyHash(passkeyHash: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(and(eq(projects.passkeyHash, passkeyHash), eq(projects.published, true))).limit(1);
  return result[0];
}
