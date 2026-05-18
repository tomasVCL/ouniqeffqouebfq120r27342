import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getTalents, getTalentById, upsertTalent, deleteTalentById, getTalentRating,
  getShortlists, getShortlistById, getShortlistByToken, createShortlist, deleteShortlist,
  addTalentToShortlist, removeTalentFromShortlist, generateShareToken,
  getSubmissions, createSubmission, updateSubmissionStatus,
  getNotes, createNote, updateNote, deleteNote,
  getAllUsers, updateUserRole,
  getDashboardStats, getRecentTalents,
} from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Talents ──────────────────────────────────────────────────────────────
  talents: router({
    list: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        discipline: z.string().optional(),
        availability: z.string().optional(),
        experienceLevel: z.string().optional(),
        location: z.string().optional(),
        skills: z.array(z.string()).optional(),
      }).optional())
      .query(({ input }) => getTalents(input ?? {})),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const t = await getTalentById(input.id);
        if (!t) throw new TRPCError({ code: "NOT_FOUND", message: "Talent not found" });
        return t;
      }),

    getRating: protectedProcedure
      .input(z.object({ talentId: z.number() }))
      .query(({ input }) => getTalentRating(input.talentId)),

    upsert: protectedProcedure
      .input(z.object({
        id: z.number().optional(),
        name: z.string().min(1),
        discipline: z.string().min(1),
        bio: z.string().optional(),
        location: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        portfolioUrl: z.string().optional(),
        instagramHandle: z.string().optional(),
        tiktokHandle: z.string().optional(),
        youtubeHandle: z.string().optional(),
        linkedinUrl: z.string().optional(),
        skills: z.array(z.string()).optional(),
        experienceLevel: z.string().optional(),
        availability: z.enum(["available", "busy", "unavailable"]).optional(),
        dayRate: z.number().optional(),
        currency: z.string().optional(),
        portfolioMedia: z.array(z.object({
          type: z.enum(["image", "video"]),
          url: z.string(),
          caption: z.string().optional(),
        })).optional(),
        status: z.string().optional(),
        source: z.string().optional(),
        submissionId: z.number().optional(),
      }))
      .mutation(({ input }) => upsertTalent(input)),
  }),

  // ── Shortlists ───────────────────────────────────────────────────────────
  shortlists: router({
    list: protectedProcedure
      .query(({ ctx }) => getShortlists(ctx.user.id)),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const sl = await getShortlistById(input.id);
        if (!sl) throw new TRPCError({ code: "NOT_FOUND", message: "Shortlist not found" });
        return sl;
      }),

    getByToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const sl = await getShortlistByToken(input.token);
        if (!sl) throw new TRPCError({ code: "NOT_FOUND", message: "Shortlist not found" });
        return sl;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      }))
      .mutation(({ input, ctx }) => createShortlist({ ...input, ownerId: ctx.user.id })),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteShortlist(input.id)),

    addTalent: protectedProcedure
      .input(z.object({ shortlistId: z.number(), talentId: z.number() }))
      .mutation(({ input, ctx }) => addTalentToShortlist(input.shortlistId, input.talentId, ctx.user.id)),

    removeTalent: protectedProcedure
      .input(z.object({ shortlistId: z.number(), talentId: z.number() }))
      .mutation(({ input }) => removeTalentFromShortlist(input.shortlistId, input.talentId)),

    generateShareToken: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => generateShareToken(input.id)),
  }),

  // ── Submissions ──────────────────────────────────────────────────────────
  submissions: router({
    list: protectedProcedure.query(() => getSubmissions()),

    create: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        discipline: z.string().min(1),
        bio: z.string().optional(),
        portfolioUrl: z.string().optional(),
        instagramHandle: z.string().optional(),
        location: z.string().optional(),
      }))
      .mutation(({ input }) => createSubmission(input)),

    approve: protectedProcedure
      .input(z.object({ id: z.number(), reviewNotes: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        await updateSubmissionStatus(input.id, "approved", ctx.user.id, input.reviewNotes);
        // Create a talent profile from the submission
        const subs = await getSubmissions();
        const sub = subs.find((s: any) => s.id === input.id);
        if (sub) {
          await upsertTalent({
            name: sub.name,
            discipline: sub.discipline,
            bio: sub.bio ?? undefined,
            email: sub.email,
            phone: sub.phone ?? undefined,
            portfolioUrl: sub.portfolioUrl ?? undefined,
            instagramHandle: sub.instagramHandle ?? undefined,
            location: sub.location ?? undefined,
            availability: "available",
            status: "approved",
            source: "submission",
            submissionId: sub.id,
          });
        }
        return { success: true };
      }),

    reject: protectedProcedure
      .input(z.object({ id: z.number(), reviewNotes: z.string().optional() }))
      .mutation(({ input, ctx }) => updateSubmissionStatus(input.id, "rejected", ctx.user.id, input.reviewNotes)),
  }),

  // ── Notes ────────────────────────────────────────────────────────────────
  // Private scout notes with optional star ratings on talent profiles
  notes: router({
    list: protectedProcedure
      .input(z.object({ talentId: z.number() }))
      .query(({ input, ctx }) => getNotes(input.talentId, ctx.user.id)),

    create: protectedProcedure
      .input(z.object({
        talentId: z.number(),
        note: z.string().min(1),
        rating: z.number().min(1).max(5).optional(),
      }))
      .mutation(({ input, ctx }) => createNote({ ...input, scoutId: ctx.user.id })),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        note: z.string().min(1),
        rating: z.number().min(1).max(5).nullable().optional(),
      }))
      .mutation(({ input, ctx }) => updateNote(input.id, ctx.user.id, input.note, input.rating)),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input, ctx }) => deleteNote(input.id, ctx.user.id)),
  }),

  // ── Admin ────────────────────────────────────────────────────────────────
  admin: router({
    listUsers: protectedProcedure
      .use(({ ctx, next }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return next({ ctx });
      })
      .query(() => getAllUsers()),

    promoteUser: protectedProcedure
      .use(({ ctx, next }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return next({ ctx });
      })
      .input(z.object({
        userId: z.number(),
        role: z.enum(["user", "admin"]),
      }))
      .mutation(({ input }) => updateUserRole(input.userId, input.role)),

    deleteTalent: protectedProcedure
      .use(({ ctx, next }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return next({ ctx });
      })
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteTalentById(input.id)),

    approveTalent: protectedProcedure
      .use(({ ctx, next }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return next({ ctx });
      })
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await import("./db").then(m => m.getDb());
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { sql } = await import("drizzle-orm");
        await db.execute(sql`UPDATE talents SET status='approved', updatedAt=NOW() WHERE id=${input.id}`);
        return { success: true };
      }),
  }),

  // ── Dashboard ────────────────────────────────────────────────────────────
  dashboard: router({
    stats: protectedProcedure.query(() => getDashboardStats()),
    recentTalents: protectedProcedure.query(() => getRecentTalents()),
  }),
});

export type AppRouter = typeof appRouter;
