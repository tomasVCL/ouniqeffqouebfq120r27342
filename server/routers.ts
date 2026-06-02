import { TRPCError } from "@trpc/server";
import * as bcrypt from "bcryptjs";
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
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
} from "./db";

export const appRouter = router({
  report: router({
    // Unified passkey login — finds the project by passkey alone, returns slug+problemId for redirect
    resolvePasskey: publicProcedure
      .input(z.object({ passkey: z.string() }))
      .mutation(async ({ input }) => {
        const all = await listProjects();
        const published = all.filter(p => p.published && p.passkeyHash);
        for (const p of published) {
          const valid = await bcrypt.compare(input.passkey, p.passkeyHash!);
          if (valid) {
            return {
              clientSlug: p.clientSlug ?? null,
              problemId: p.problemId ?? null,
              projectId: p.id,
            };
          }
        }
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Clave de acceso inválida" });
      }),

    // Load report by projectId + passkey (legacy route /client/v2/:id)
    getByPasskey: publicProcedure
      .input(z.object({ projectId: z.number(), passkey: z.string() }))
      .query(async ({ input }) => {
        const project = await getProject(input.projectId);
        if (!project || !project.published) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Reporte no encontrado o no publicado" });
        }
        if (!project.passkeyHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Sin clave de acceso configurada" });
        }
        const valid = await bcrypt.compare(input.passkey, project.passkeyHash);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Clave de acceso inválida" });
        }
        return buildReportPayload(project, input.projectId);
      }),

    // Load report by clientSlug + problemId (new slug route /:clientSlug/:problemId)
    getBySlug: publicProcedure
      .input(z.object({ clientSlug: z.string(), problemId: z.string() }))
      .query(async ({ input }) => {
        const project = await getProjectBySlug(input.clientSlug, input.problemId);
        if (!project || !project.published) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Reporte no encontrado" });
        }
        return buildReportPayload(project, project.id);
      }),

    // List all published projects (for the passkey entry page)
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

// ─── Shared report payload builder ───────────────────────────────────────────
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
      analystEmail: project!.analystEmail,
      analystPhone: project!.analystPhone,
      scopeDescription: project!.scopeDescription,
      universeSize: project!.universeSize,
      eligibleCount: project!.eligibleCount,
      excludedCount: project!.excludedCount,
      publishedAt: project!.publishedAt,
      clientLogoUrl: project!.clientLogoUrl,
      clientSlug: project!.clientSlug,
      problemId: project!.problemId,
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
