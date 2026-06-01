import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2";
import { projects, requirements, clusters, startups, wsmScores, rankings, recommendations, publishLog } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

// Reuse a small connection pool across warm serverless invocations. Cloud MySQL
// providers (TiDB Cloud, PlanetScale) require TLS; it is enabled automatically
// for any non-local host so local development keeps working without SSL.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      const isLocal = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
      const pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        connectionLimit: 5,
        ...(isLocal ? {} : { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true } }),
      });
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
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

// ─── WSM Scores ───────────────────────────────────────────────────────────
export async function getWsmScores(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(wsmScores).where(eq(wsmScores.projectId, projectId));
}

export async function upsertWsmScore(data: { projectId: number; startupId: number; requirementId: number; humanScore?: number | null; aiScore?: number | null; justificationNote?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(wsmScores).where(and(eq(wsmScores.projectId, data.projectId), eq(wsmScores.startupId, data.startupId), eq(wsmScores.requirementId, data.requirementId))).limit(1);
  if (existing.length > 0) {
    await db.update(wsmScores).set(data).where(eq(wsmScores.id, existing[0].id));
  } else {
    await db.insert(wsmScores).values(data);
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
  if (!db) throw new Error("DB not available");
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
  if (!db) throw new Error("DB not available");
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
