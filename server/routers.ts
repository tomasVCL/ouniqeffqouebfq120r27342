import { TRPCError } from "@trpc/server";
import * as bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import {
  getProjectBySlug,
  getClusters,
  getRankings,
  getRecommendations,
  getRequirements,
  getStartups,
  getWsmScores,
  listProjects,
  getProject,
  countRecentAttempts,
  insertAttempt,
  insertFeedback,
} from "./db";

// ── JWT helpers ───────────────────────────────────────────────────────────────
const secret = () => new TextEncoder().encode(ENV.jwtSecret);

async function signSession(projectId: number, clientSlug: string | null, problemId: string | null) {
  return new SignJWT({ sub: String(projectId), slug: clientSlug ?? "", pid: problemId ?? "" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret());
}

async function verifySession(token: string): Promise<{ projectId: number; slug: string; pid: string }> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      projectId: Number(payload.sub),
      slug: String(payload.slug ?? ""),
      pid: String(payload.pid ?? ""),
    };
  } catch {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sesión inválida o expirada" });
  }
}

// ── Rate limiting ─────────────────────────────────────────────────────────────
const RATE_LIMIT = 30;       // max attempts
const RATE_WINDOW_MIN = 15;  // minutes

async function checkRateLimit(req: { headers: Record<string, string | string[] | undefined> }) {
  const ip =
    String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim() ||
    String(req.headers["x-real-ip"] ?? "") ||
    "unknown";

  const attempts = await countRecentAttempts(ip, RATE_WINDOW_MIN);
  if (attempts >= RATE_LIMIT) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Demasiados intentos. Espera ${RATE_WINDOW_MIN} minutos e inténtalo de nuevo.`,
    });
  }
  await insertAttempt(ip);
}

// ── Router ────────────────────────────────────────────────────────────────────
export const appRouter = router({
  report: router({
    // Unified passkey login — rate-limited, returns a signed JWT session token
    resolvePasskey: publicProcedure
      .input(z.object({ passkey: z.string().max(128) }))
      .mutation(async ({ input, ctx }) => {
        await checkRateLimit(ctx.req);

        const all = await listProjects();
        const published = all.filter(p => p.published && p.passkeyHash);
        for (const p of published) {
          const valid = await bcrypt.compare(input.passkey, p.passkeyHash!);
          if (valid) {
            const sessionToken = await signSession(p.id, p.clientSlug ?? null, p.problemId ?? null);
            return {
              clientSlug: p.clientSlug ?? null,
              problemId: p.problemId ?? null,
              projectId: p.id,
              sessionToken,
            };
          }
        }
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Clave de acceso inválida" });
      }),

    // Load report by clientSlug + problemId — requires valid JWT session token
    getBySlug: publicProcedure
      .input(z.object({ clientSlug: z.string(), problemId: z.string(), sessionToken: z.string() }))
      .query(async ({ input }) => {
        const session = await verifySession(input.sessionToken);

        // Ensure the token is for this specific report
        if (session.slug !== input.clientSlug || session.pid !== input.problemId) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Sesión no válida para este reporte" });
        }

        const project = await getProjectBySlug(input.clientSlug, input.problemId);
        if (!project || !project.published) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Reporte no encontrado" });
        }
        return buildReportPayload(project, project.id);
      }),

    // Legacy route /client/v2/:id — also requires JWT
    getByPasskey: publicProcedure
      .input(z.object({ projectId: z.number(), sessionToken: z.string() }))
      .query(async ({ input }) => {
        const session = await verifySession(input.sessionToken);

        if (session.projectId !== input.projectId) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Sesión no válida para este reporte" });
        }

        const project = await getProject(input.projectId);
        if (!project || !project.published) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Reporte no encontrado o no publicado" });
        }
        return buildReportPayload(project, input.projectId);
      }),

    // Submit client feedback on the briefing
    submitFeedback: publicProcedure
      .input(z.object({
        sessionToken: z.string(),
        projectId: z.number(),
        authorName: z.string().max(255).optional(),
        items: z.array(z.object({
          section: z.string().max(64),
          requirementId: z.number().optional(),
          commentText: z.string().max(4000),
          suggestedWeight: z.number().min(0).max(1).optional(),
        })).min(1).max(50),
      }))
      .mutation(async ({ input }) => {
        const session = await verifySession(input.sessionToken);
        if (session.projectId !== input.projectId) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Sesión no válida" });
        }
        for (const item of input.items) {
          await insertFeedback({
            projectId: input.projectId,
            section: item.section,
            requirementId: item.requirementId ?? null,
            commentText: item.commentText,
            suggestedWeight: item.suggestedWeight ?? null,
            authorName: input.authorName ?? null,
          });
        }
        return { ok: true };
      }),

    // List published projects (passkey entry page — public)
    listPublished: publicProcedure.query(async () => {
      const all = await listProjects();
      return all.filter(p => p.published).map(p => ({
        id: p.id,
        title: p.title,
        clientName: p.clientName,
        industry: p.industry,
        publishedAt: p.publishedAt,
      }));
    }),
  }),
});

// ── Shared report payload builder ─────────────────────────────────────────────
async function buildReportPayload(project: Awaited<ReturnType<typeof getProject>>, projectId: number) {
  const [reqs, clusterList, startupList, wsmList, rankingList, recList] = await Promise.all([
    getRequirements(projectId),
    getClusters(projectId),
    getStartups(projectId),
    getWsmScores(projectId),
    getRankings(projectId),
    getRecommendations(projectId),
  ]);

  return {
    project: {
      id: project!.id,
      title: project!.title,
      clientName: project!.clientName,
      industry: project!.industry,
      geoAllowed: project!.geoAllowed,
      geoExcluded: project!.geoExcluded,
      reportDate: project!.reportDate,
      analystName: project!.analystName,
      // analystEmail and analystPhone intentionally omitted (internal data)
      scopeDescription: project!.scopeDescription,
      universeSize: project!.universeSize,
      eligibleCount: project!.eligibleCount,
      excludedCount: project!.excludedCount,
      publishedAt: project!.publishedAt,
      clientLogoUrl: project!.clientLogoUrl,
      clientSlug: project!.clientSlug,
      problemId: project!.problemId,
      briefingContent: project!.briefingContent ?? null,
    },
    requirements: reqs,
    clusters: clusterList,
    startups: startupList,
    wsmScores: wsmList,
    rankings: rankingList,
    recommendations: recList,
  };
}

export type AppRouter = typeof appRouter;
