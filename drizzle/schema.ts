import {
  boolean,
  float,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────────────
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

// ─── Talents ─────────────────────────────────────────────────────────────────
// Approved talent profiles visible in the Discover tab
export const talents = mysqlTable("talents", {
  id: int("id").autoincrement().primaryKey(),
  // Basic info
  name: varchar("name", { length: 255 }).notNull(),
  discipline: varchar("discipline", { length: 128 }).notNull(), // e.g. "Actor", "Model", "Photographer"
  bio: text("bio"),
  location: varchar("location", { length: 255 }),
  experienceLevel: mysqlEnum("experienceLevel", ["emerging", "mid", "established", "star"]).default("emerging").notNull(),
  availability: mysqlEnum("availability", ["available", "busy", "unavailable"]).default("available").notNull(),
  // Contact & links
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 64 }),
  portfolioUrl: text("portfolioUrl"),
  instagramHandle: varchar("instagramHandle", { length: 128 }),
  tiktokHandle: varchar("tiktokHandle", { length: 128 }),
  youtubeHandle: varchar("youtubeHandle", { length: 128 }),
  linkedinUrl: text("linkedinUrl"),
  // Skills (stored as JSON array of strings)
  skills: json("skills").$type<string[]>().default([]),
  // Portfolio media (JSON array of {type: 'image'|'video', url: string, caption?: string})
  portfolioMedia: json("portfolioMedia").$type<Array<{ type: "image" | "video"; url: string; caption?: string }>>().default([]),
  // Rates
  dayRate: float("dayRate"),
  currency: varchar("currency", { length: 8 }).default("USD"),
  // Status (admin-controlled)
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  // Source: submitted via form or manually added by admin
  source: mysqlEnum("source", ["submission", "manual"]).default("submission").notNull(),
  // Submission reference (if created from a submission)
  submissionId: int("submissionId"),
  // Admin notes
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Talent = typeof talents.$inferSelect;
export type InsertTalent = typeof talents.$inferInsert;

// ─── Talent Submissions (public intake form) ──────────────────────────────────
export const submissions = mysqlTable("submissions", {
  id: int("id").autoincrement().primaryKey(),
  // Submitted data
  name: varchar("name", { length: 255 }).notNull(),
  discipline: varchar("discipline", { length: 128 }).notNull(),
  bio: text("bio"),
  location: varchar("location", { length: 255 }),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 64 }),
  portfolioUrl: text("portfolioUrl"),
  instagramHandle: varchar("instagramHandle", { length: 128 }),
  skills: json("skills").$type<string[]>().default([]),
  experienceLevel: mysqlEnum("experienceLevel", ["emerging", "mid", "established", "star"]).default("emerging").notNull(),
  // Review status
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  // Resulting talent ID if approved
  talentId: int("talentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = typeof submissions.$inferInsert;

// ─── Scout Notes ─────────────────────────────────────────────────────────────
// Private notes left by scouts on talent profiles
export const scoutNotes = mysqlTable("scout_notes", {
  id: int("id").autoincrement().primaryKey(),
  talentId: int("talentId").notNull(),
  scoutId: int("scoutId").notNull(),
  note: text("note").notNull(),
  rating: int("rating"), // 1-5 star rating, nullable
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScoutNote = typeof scoutNotes.$inferSelect;
export type InsertScoutNote = typeof scoutNotes.$inferInsert;

// ─── Shortlists ───────────────────────────────────────────────────────────────
export const shortlists = mysqlTable("shortlists", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  // Share token for team sharing (null = private)
  shareToken: varchar("shareToken", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Shortlist = typeof shortlists.$inferSelect;
export type InsertShortlist = typeof shortlists.$inferInsert;

// ─── Shortlist Members ────────────────────────────────────────────────────────
export const shortlistMembers = mysqlTable("shortlist_members", {
  id: int("id").autoincrement().primaryKey(),
  shortlistId: int("shortlistId").notNull(),
  talentId: int("talentId").notNull(),
  addedBy: int("addedBy").notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ShortlistMember = typeof shortlistMembers.$inferSelect;
export type InsertShortlistMember = typeof shortlistMembers.$inferInsert;

// ─── Saved Searches ───────────────────────────────────────────────────────────
export const savedSearches = mysqlTable("saved_searches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  filters: json("filters").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SavedSearch = typeof savedSearches.$inferSelect;
export type InsertSavedSearch = typeof savedSearches.$inferInsert;
