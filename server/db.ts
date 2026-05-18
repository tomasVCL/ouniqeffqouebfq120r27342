import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

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

// ── Auth helpers ─────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ── Talent helpers ────────────────────────────────────────────────────────────

export async function getTalents(filters: {
  search?: string;
  discipline?: string;
  availability?: string;
  experienceLevel?: string;
  location?: string;
  skills?: string[];
}) {
  const db = await getDb();
  if (!db) return [];
  let whereClause = sql`WHERE status = 'approved'`;
  if (filters.search) {
    const term = `%${filters.search}%`;
    whereClause = sql`${whereClause} AND (name LIKE ${term} OR discipline LIKE ${term} OR location LIKE ${term} OR bio LIKE ${term})`;
  }
  if (filters.discipline) whereClause = sql`${whereClause} AND discipline = ${filters.discipline}`;
  if (filters.availability) whereClause = sql`${whereClause} AND availability = ${filters.availability}`;
  if (filters.experienceLevel) whereClause = sql`${whereClause} AND experienceLevel = ${filters.experienceLevel}`;
  if (filters.location) whereClause = sql`${whereClause} AND location LIKE ${`%${filters.location}%`}`;
  const [rows] = await db.execute(sql`SELECT * FROM talents ${whereClause} ORDER BY createdAt DESC`) as any;
  return rows as any[];
}

export async function getTalentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [rows] = await db.execute(sql`SELECT * FROM talents WHERE id = ${id} LIMIT 1`) as any;
  return rows[0] ?? null;
}

export async function upsertTalent(data: {
  id?: number;
  name: string;
  discipline: string;
  bio?: string;
  location?: string;
  email?: string;
  phone?: string;
  portfolioUrl?: string;
  instagramHandle?: string;
  tiktokHandle?: string;
  youtubeHandle?: string;
  linkedinUrl?: string;
  skills?: string[];
  experienceLevel?: string;
  availability?: string;
  dayRate?: number;
  currency?: string;
  portfolioMedia?: Array<{ type: "image" | "video"; url: string; caption?: string }>;
  status?: string;
  source?: string;
  submissionId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const skillsJson = JSON.stringify(data.skills ?? []);
  const mediaJson = JSON.stringify(data.portfolioMedia ?? []);
  if (data.id) {
    await db.execute(sql`
      UPDATE talents SET
        name=${data.name}, discipline=${data.discipline}, bio=${data.bio ?? null},
        location=${data.location ?? null}, email=${data.email ?? null}, phone=${data.phone ?? null},
        portfolioUrl=${data.portfolioUrl ?? null}, instagramHandle=${data.instagramHandle ?? null},
        tiktokHandle=${data.tiktokHandle ?? null}, youtubeHandle=${data.youtubeHandle ?? null},
        linkedinUrl=${data.linkedinUrl ?? null}, skills=${skillsJson},
        experienceLevel=${data.experienceLevel ?? "emerging"},
        availability=${data.availability ?? "available"},
        dayRate=${data.dayRate ?? null}, currency=${data.currency ?? "USD"},
        portfolioMedia=${mediaJson}, updatedAt=NOW()
      WHERE id=${data.id}
    `);
    return { id: data.id };
  } else {
    const [result] = await db.execute(sql`
      INSERT INTO talents (name, discipline, bio, location, email, phone, portfolioUrl,
        instagramHandle, tiktokHandle, youtubeHandle, linkedinUrl, skills, experienceLevel,
        availability, dayRate, currency, portfolioMedia, status, source, submissionId, createdAt, updatedAt)
      VALUES (${data.name}, ${data.discipline}, ${data.bio ?? null}, ${data.location ?? null},
        ${data.email ?? null}, ${data.phone ?? null}, ${data.portfolioUrl ?? null},
        ${data.instagramHandle ?? null}, ${data.tiktokHandle ?? null}, ${data.youtubeHandle ?? null},
        ${data.linkedinUrl ?? null}, ${skillsJson}, ${data.experienceLevel ?? "emerging"},
        ${data.availability ?? "available"}, ${data.dayRate ?? null}, ${data.currency ?? "USD"},
        ${mediaJson}, ${data.status ?? "approved"}, ${data.source ?? "manual"},
        ${data.submissionId ?? null}, NOW(), NOW())
    `) as any;
    return { id: (result as any).insertId };
  }
}

export async function deleteTalentById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.execute(sql`DELETE FROM shortlist_members WHERE talentId=${id}`);
  await db.execute(sql`DELETE FROM scout_notes WHERE talentId=${id}`);
  await db.execute(sql`DELETE FROM talents WHERE id=${id}`);
  return { success: true };
}

export async function getTalentRating(talentId: number) {
  const db = await getDb();
  if (!db) return { avg: null, count: 0 };
  const [rows] = await db.execute(sql`
    SELECT AVG(rating) as avg, COUNT(rating) as count
    FROM scout_notes
    WHERE talentId=${talentId} AND rating IS NOT NULL
  `) as any;
  const row = rows[0];
  return {
    avg: row?.avg ? Number(row.avg) : null,
    count: Number(row?.count ?? 0),
  };
}

// ── Shortlist helpers ─────────────────────────────────────────────────────────

export async function getShortlists(userId?: number) {
  const db = await getDb();
  if (!db) return [];
  const [rows] = await db.execute(sql`
    SELECT s.*, COUNT(sm.id) as talentCount
    FROM shortlists s
    LEFT JOIN shortlist_members sm ON sm.shortlistId = s.id
    ${userId ? sql`WHERE s.ownerId = ${userId}` : sql``}
    GROUP BY s.id
    ORDER BY s.createdAt DESC
  `) as any;
  return rows as any[];
}

export async function getShortlistById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [slRows] = await db.execute(sql`SELECT * FROM shortlists WHERE id=${id} LIMIT 1`) as any;
  const sl = slRows[0];
  if (!sl) return null;
  const [talentRows] = await db.execute(sql`
    SELECT sm.id, sm.shortlistId, sm.talentId, sm.addedBy, sm.note, sm.createdAt as addedAt,
           t.name, t.discipline, t.location, t.availability, t.experienceLevel, t.bio,
           t.portfolioUrl, t.instagramHandle, t.skills, t.portfolioMedia
    FROM shortlist_members sm
    JOIN talents t ON t.id = sm.talentId
    WHERE sm.shortlistId=${id}
    ORDER BY sm.createdAt DESC
  `) as any;
  return {
    ...sl,
    talents: talentRows.map((r: any) => ({
      id: r.id,
      talentId: r.talentId,
      addedAt: r.addedAt,
      note: r.note,
      talent: {
        id: r.talentId,
        name: r.name,
        discipline: r.discipline,
        location: r.location,
        availability: r.availability,
        experienceLevel: r.experienceLevel,
        bio: r.bio,
        portfolioUrl: r.portfolioUrl,
        instagramHandle: r.instagramHandle,
        skills: tryParseJson(r.skills, []),
        portfolioMedia: tryParseJson(r.portfolioMedia, []),
      },
    })),
  };
}

export async function getShortlistByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const [slRows] = await db.execute(sql`SELECT * FROM shortlists WHERE shareToken=${token} LIMIT 1`) as any;
  const sl = slRows[0];
  if (!sl) return null;
  return getShortlistById(sl.id);
}

export async function createShortlist(data: { name: string; description?: string; ownerId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.execute(sql`
    INSERT INTO shortlists (ownerId, name, description, createdAt, updatedAt)
    VALUES (${data.ownerId}, ${data.name}, ${data.description ?? null}, NOW(), NOW())
  `) as any;
  return { id: (result as any).insertId };
}

export async function deleteShortlist(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.execute(sql`DELETE FROM shortlist_members WHERE shortlistId=${id}`);
  await db.execute(sql`DELETE FROM shortlists WHERE id=${id}`);
  return { success: true };
}

export async function addTalentToShortlist(shortlistId: number, talentId: number, addedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.execute(sql`
    INSERT IGNORE INTO shortlist_members (shortlistId, talentId, addedBy, createdAt)
    VALUES (${shortlistId}, ${talentId}, ${addedBy}, NOW())
  `);
  return { success: true };
}

export async function removeTalentFromShortlist(shortlistId: number, talentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.execute(sql`DELETE FROM shortlist_members WHERE shortlistId=${shortlistId} AND talentId=${talentId}`);
  return { success: true };
}

export async function generateShareToken(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const token = nanoid(16);
  await db.execute(sql`UPDATE shortlists SET shareToken=${token}, updatedAt=NOW() WHERE id=${id}`);
  return { token };
}

// ── Submission helpers ────────────────────────────────────────────────────────

export async function getSubmissions() {
  const db = await getDb();
  if (!db) return [];
  const [rows] = await db.execute(sql`SELECT * FROM submissions ORDER BY createdAt DESC`) as any;
  return rows as any[];
}

export async function createSubmission(data: {
  name: string;
  email: string;
  phone?: string;
  discipline: string;
  bio?: string;
  portfolioUrl?: string;
  instagramHandle?: string;
  location?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.execute(sql`
    INSERT INTO submissions (name, email, phone, discipline, bio, portfolioUrl, instagramHandle, location, status, createdAt, updatedAt)
    VALUES (${data.name}, ${data.email}, ${data.phone ?? null}, ${data.discipline},
      ${data.bio ?? null}, ${data.portfolioUrl ?? null}, ${data.instagramHandle ?? null},
      ${data.location ?? null}, 'pending', NOW(), NOW())
  `) as any;
  return { id: (result as any).insertId };
}

export async function updateSubmissionStatus(
  id: number,
  status: "approved" | "rejected",
  reviewedBy?: number,
  reviewNotes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.execute(sql`
    UPDATE submissions SET
      status=${status},
      reviewedBy=${reviewedBy ?? null},
      reviewedAt=NOW(),
      reviewNotes=${reviewNotes ?? null},
      updatedAt=NOW()
    WHERE id=${id}
  `);
  return { success: true };
}

// ── Scout Notes helpers ───────────────────────────────────────────────────────
// Notes are private per scout. Rating is stored on the note.

export async function getNotes(talentId: number, scoutId: number) {
  const db = await getDb();
  if (!db) return [];
  const [rows] = await db.execute(sql`
    SELECT * FROM scout_notes WHERE talentId=${talentId} AND scoutId=${scoutId}
    ORDER BY createdAt DESC
  `) as any;
  return rows as any[];
}

export async function createNote(data: { talentId: number; scoutId: number; note: string; rating?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.execute(sql`
    INSERT INTO scout_notes (talentId, scoutId, note, rating, createdAt, updatedAt)
    VALUES (${data.talentId}, ${data.scoutId}, ${data.note}, ${data.rating ?? null}, NOW(), NOW())
  `) as any;
  return { id: (result as any).insertId };
}

export async function updateNote(id: number, scoutId: number, note: string, rating?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.execute(sql`
    UPDATE scout_notes SET note=${note}, rating=${rating ?? null}, updatedAt=NOW()
    WHERE id=${id} AND scoutId=${scoutId}
  `);
  return { id };
}

export async function deleteNote(id: number, scoutId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.execute(sql`DELETE FROM scout_notes WHERE id=${id} AND scoutId=${scoutId}`);
  return { success: true };
}

// ── Admin helpers ─────────────────────────────────────────────────────────────

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(users).orderBy(desc(users.createdAt));
  return result;
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
  return { success: true };
}

// ── Dashboard helpers ─────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { totalTalents: 0, totalShortlists: 0, pendingSubmissions: 0, avgRating: null };
  const [[talentRow], [shortlistRow], [submissionRow], [ratingRow]] = await Promise.all([
    db.execute(sql`SELECT COUNT(*) as count FROM talents WHERE status='approved'`) as any,
    db.execute(sql`SELECT COUNT(*) as count FROM shortlists`) as any,
    db.execute(sql`SELECT COUNT(*) as count FROM submissions WHERE status='pending'`) as any,
    db.execute(sql`SELECT AVG(rating) as avg FROM scout_notes WHERE rating IS NOT NULL`) as any,
  ]);
  return {
    totalTalents: Number(talentRow[0]?.count ?? 0),
    totalShortlists: Number(shortlistRow[0]?.count ?? 0),
    pendingSubmissions: Number(submissionRow[0]?.count ?? 0),
    avgRating: ratingRow[0]?.avg ? Number(ratingRow[0].avg).toFixed(1) : null,
  };
}

export async function getRecentTalents() {
  const db = await getDb();
  if (!db) return [];
  const [rows] = await db.execute(sql`SELECT * FROM talents WHERE status='approved' ORDER BY createdAt DESC LIMIT 8`) as any;
  return rows as any[];
}

// ── Utility ───────────────────────────────────────────────────────────────────

function tryParseJson(val: any, fallback: any) {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}
