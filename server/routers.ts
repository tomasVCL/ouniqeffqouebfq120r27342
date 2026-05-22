import { TRPCError } from "@trpc/server";
import * as bcrypt from "bcryptjs";
import * as jose from "jose";
import { z } from "zod";
import { ENV } from "./_core/env";
import { invokeLLM } from "./_core/llm";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import {
  addPublishLog,
  analystCredentialExists,
  createAnalystCredential,
  deleteCapability,
  deleteCluster,
  deleteFormula,
  deleteFormulaVariable,
  deleteProject,
  deleteRequirement,
  deleteStartup,
  getAnalystByUsername,
  getCapabilities,
  getCapfitScores,
  getClusters,
  getFormulas,
  getProject,
  getPublishLog,
  getPublishedProjectByPasskeyHash,
  getPughScores,
  getRankings,
  getRecommendations,
  getRequirements,
  getStartups,
  getWsmScores,
  listProjects,
  replaceFormulaVariables,
  updateProject,
  upsertCapability,
  upsertCapfitScore,
  upsertCluster,
  upsertFormula,
  upsertRanking,
  upsertRecommendation,
  upsertRequirement,
  upsertStartup,
  upsertUser,
  getUserByOpenId,
  createProject,
  upsertWsmScore,
  upsertPughScore,
} from "./db";

// ─── Analyst JWT helpers ──────────────────────────────────────────────────
const ANALYST_COOKIE = "vcl_analyst_session";
const ANALYST_JWT_SECRET = new TextEncoder().encode(ENV.cookieSecret + "_analyst");

async function signAnalystJwt() {
  return new jose.SignJWT({ role: "analyst" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("12h")
    .sign(ANALYST_JWT_SECRET);
}

async function verifyAnalystJwt(token: string) {
  try {
    await jose.jwtVerify(token, ANALYST_JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

// Middleware: require analyst session
const analystProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const cookie = ctx.req.cookies?.[ANALYST_COOKIE];
  if (!cookie || !(await verifyAnalystJwt(cookie))) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Analyst session required" });
  }
  return next({ ctx });
});

// ─── CapFit score numeric conversion ─────────────────────────────────────
function capfitToNum(v: string | null | undefined): number {
  if (v === "High") return 1;
  if (v === "Med") return 0.5;
  if (v === "Low") return 0;
  return 0;
}

export const appRouter = router({
  system: systemRouter,

  // ─── Manus OAuth (kept for system) ──────────────────────────────────
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Analyst Auth ────────────────────────────────────────────────────
  analyst: router({
    // Check if setup is needed (first run)
    needsSetup: publicProcedure.query(async () => {
      const exists = await analystCredentialExists();
      return { needsSetup: !exists };
    }),

    // First-time setup: create the shared analyst account
    setup: publicProcedure
      .input(z.object({ username: z.string().min(3), password: z.string().min(8) }))
      .mutation(async ({ input }) => {
        const exists = await analystCredentialExists();
        if (exists) throw new TRPCError({ code: "FORBIDDEN", message: "Setup already completed" });
        const passwordHash = await bcrypt.hash(input.password, 12);
        await createAnalystCredential(input.username, passwordHash);
        return { success: true };
      }),

    // Login
    login: publicProcedure
      .input(z.object({ username: z.string(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const cred = await getAnalystByUsername(input.username);
        if (!cred) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
        const valid = await bcrypt.compare(input.password, cred.passwordHash);
        if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
        const token = await signAnalystJwt();
        const isSecure = ctx.req.protocol === "https" || ctx.req.headers["x-forwarded-proto"] === "https";
        ctx.res.cookie(ANALYST_COOKIE, token, {
          httpOnly: true,
          secure: isSecure,
          sameSite: isSecure ? "none" : "lax",
          maxAge: 12 * 60 * 60 * 1000,
          path: "/",
        });
        return { success: true };
      }),

    // Check session
    me: publicProcedure.query(async ({ ctx }) => {
      const cookie = ctx.req.cookies?.[ANALYST_COOKIE];
      if (!cookie) return { authenticated: false };
      const valid = await verifyAnalystJwt(cookie);
      return { authenticated: valid };
    }),

    // Logout
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(ANALYST_COOKIE, { path: "/" });
      return { success: true };
    }),
  }),

  // ─── Projects ────────────────────────────────────────────────────────
  projects: router({
    list: analystProcedure.query(() => listProjects()),

    get: analystProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const p = await getProject(input.id);
        if (!p) throw new TRPCError({ code: "NOT_FOUND" });
        return p;
      }),

    create: analystProcedure
      .input(z.object({
        title: z.string().min(1),
        clientName: z.string().min(1),
        industry: z.string().optional(),
        geoAllowed: z.string().optional(),
        geoExcluded: z.string().optional(),
        reportDate: z.string().optional(),
        analystName: z.string().optional(),
        analystEmail: z.string().optional(),
        analystPhone: z.string().optional(),
        passkey: z.string().min(6).optional(),
      }))
      .mutation(async ({ input }) => {
        const { passkey, ...rest } = input;
        const passkeyHash = passkey ? await bcrypt.hash(passkey, 10) : undefined;
        const id = await createProject({ ...rest, passkeyHash });
        return { id };
      }),

    update: analystProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        clientName: z.string().optional(),
        industry: z.string().optional(),
        geoAllowed: z.string().optional(),
        geoExcluded: z.string().optional(),
        reportDate: z.string().optional(),
        analystName: z.string().optional(),
        analystEmail: z.string().optional(),
        analystPhone: z.string().optional(),
        passkey: z.string().min(6).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, passkey, ...rest } = input;
        const update: Record<string, unknown> = { ...rest };
        if (passkey) update.passkeyHash = await bcrypt.hash(passkey, 10);
        await updateProject(id, update);
        return { success: true };
      }),

    delete: analystProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteProject(input.id);
        return { success: true };
      }),
  }),

  // ─── Requirements ────────────────────────────────────────────────────
  requirements: router({
    list: analystProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => getRequirements(input.projectId)),

    upsert: analystProcedure
      .input(z.object({
        id: z.number().optional(),
        projectId: z.number(),
        name: z.string().min(1),
        category: z.string().optional(),
        weight: z.number().min(0).max(100),
        mandatory: z.boolean().optional(),
        description: z.string().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await upsertRequirement(input as Parameters<typeof upsertRequirement>[0]);
        return { id };
      }),

    delete: analystProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteRequirement(input.id);
        return { success: true };
      }),
  }),

  // ─── Formulas ────────────────────────────────────────────────────────
  formulas: router({
    list: analystProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => getFormulas(input.projectId)),

    upsert: analystProcedure
      .input(z.object({
        id: z.number().optional(),
        projectId: z.number(),
        name: z.string().min(1),
        type: z.enum(["Revenue", "Cost Savings", "Risk Reduction", "Time Savings"]),
        expression: z.string().min(1),
        description: z.string().optional(),
        result: z.number().optional(),
        sortOrder: z.number().optional(),
        variables: z.array(z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          unit: z.string().optional(),
          value: z.number(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        const { variables, ...formulaData } = input;
        const id = await upsertFormula(formulaData as Parameters<typeof upsertFormula>[0]);
        if (variables !== undefined && id) {
          await replaceFormulaVariables(id, variables);
        }
        return { id };
      }),

    delete: analystProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteFormula(input.id);
        return { success: true };
      }),
  }),

  // ─── Clusters ────────────────────────────────────────────────────────
  clusters: router({
    list: analystProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => getClusters(input.projectId)),

    upsert: analystProcedure
      .input(z.object({
        id: z.number().optional(),
        projectId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        color: z.string().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await upsertCluster(input as Parameters<typeof upsertCluster>[0]);
        return { id };
      }),

    delete: analystProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCluster(input.id);
        return { success: true };
      }),
  }),

  // ─── Startups ────────────────────────────────────────────────────────
  startups: router({
    list: analystProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => getStartups(input.projectId)),

    upsert: analystProcedure
      .input(z.object({
        id: z.number().optional(),
        projectId: z.number(),
        name: z.string().min(1),
        tagline: z.string().optional(),
        hqCity: z.string().optional(),
        hqCountry: z.string().optional(),
        foundedYear: z.number().optional(),
        fundingStage: z.enum(["Pre-seed", "Seed", "Series A", "Series B", "Series B+"]).optional(),
        trlLevel: z.number().min(1).max(9).optional(),
        employeeRange: z.string().optional(),
        eligible: z.boolean().optional(),
        excludedReason: z.string().optional(),
        clusterId: z.number().nullable().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await upsertStartup(input as Parameters<typeof upsertStartup>[0]);
        return { id };
      }),

    delete: analystProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteStartup(input.id);
        return { success: true };
      }),
  }),

  // ─── Capabilities ────────────────────────────────────────────────────
  capabilities: router({
    list: analystProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => getCapabilities(input.projectId)),

    upsert: analystProcedure
      .input(z.object({
        id: z.number().optional(),
        projectId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await upsertCapability(input as Parameters<typeof upsertCapability>[0]);
        return { id };
      }),

    delete: analystProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCapability(input.id);
        return { success: true };
      }),
  }),

  // ─── Scores ──────────────────────────────────────────────────────────
  scores: router({
    getAll: analystProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const [wsm, pugh, capfit] = await Promise.all([
          getWsmScores(input.projectId),
          getPughScores(input.projectId),
          getCapfitScores(input.projectId),
        ]);
        return { wsm, pugh, capfit };
      }),

    upsertWsm: analystProcedure
      .input(z.object({
        projectId: z.number(),
        startupId: z.number(),
        requirementId: z.number(),
        humanScore: z.number().min(0).max(10).nullable().optional(),
        aiScore: z.number().min(0).max(10).nullable().optional(),
        justificationNote: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        await upsertWsmScore(input);
        return { success: true };
      }),

    upsertPugh: analystProcedure
      .input(z.object({
        projectId: z.number(),
        startupId: z.number(),
        requirementId: z.number(),
        humanScore: z.number().min(-1).max(1).nullable().optional(),
        aiScore: z.number().min(-1).max(1).nullable().optional(),
        justificationNote: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        await upsertPughScore(input);
        return { success: true };
      }),

    upsertCapfit: analystProcedure
      .input(z.object({
        projectId: z.number(),
        startupId: z.number(),
        capabilityId: z.number(),
        humanScore: z.enum(["High", "Med", "Low"]).nullable().optional(),
        aiScore: z.enum(["High", "Med", "Low"]).nullable().optional(),
        justificationNote: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        await upsertCapfitScore(input);
        return { success: true };
      }),

    // AI suggest scores for a matrix
    aiSuggest: analystProcedure
      .input(z.object({
        projectId: z.number(),
        matrixType: z.enum(["wsm", "pugh", "capfit"]),
      }))
      .mutation(async ({ input }) => {
        const project = await getProject(input.projectId);
        if (!project) throw new TRPCError({ code: "NOT_FOUND" });
        const [reqs, caps, startupList] = await Promise.all([
          getRequirements(input.projectId),
          getCapabilities(input.projectId),
          getStartups(input.projectId),
        ]);
        const eligibleStartups = startupList.filter(s => s.eligible);

        let systemPrompt = "";
        let userPrompt = "";

        if (input.matrixType === "wsm") {
          systemPrompt = "You are an innovation scouting analyst. Score startups on requirements using WSM (0-10 scale). Return JSON array.";
          userPrompt = `Project: ${project.title} for ${project.clientName} (${project.industry}).
Requirements: ${reqs.map(r => `${r.id}: ${r.name} (weight: ${r.weight}%)`).join(", ")}.
Startups: ${eligibleStartups.map(s => `${s.id}: ${s.name} - ${s.tagline || ""}`).join(", ")}.
Return JSON: [{"startupId": N, "requirementId": N, "aiScore": 0-10, "justificationNote": "brief reason"}]`;
        } else if (input.matrixType === "pugh") {
          systemPrompt = "You are an innovation scouting analyst. Score startups on requirements using Pugh matrix (-1, 0, +1). Return JSON array.";
          userPrompt = `Project: ${project.title} for ${project.clientName} (${project.industry}).
Requirements: ${reqs.map(r => `${r.id}: ${r.name}`).join(", ")}.
Startups: ${eligibleStartups.map(s => `${s.id}: ${s.name} - ${s.tagline || ""}`).join(", ")}.
Return JSON: [{"startupId": N, "requirementId": N, "aiScore": -1|0|1, "justificationNote": "brief reason"}]`;
        } else {
          systemPrompt = "You are an innovation scouting analyst. Score startups on capabilities using High/Med/Low. Return JSON array.";
          userPrompt = `Project: ${project.title} for ${project.clientName} (${project.industry}).
Capabilities: ${caps.map(c => `${c.id}: ${c.name}`).join(", ")}.
Startups: ${eligibleStartups.map(s => `${s.id}: ${s.name} - ${s.tagline || ""}`).join(", ")}.
Return JSON: [{"startupId": N, "capabilityId": N, "aiScore": "High"|"Med"|"Low", "justificationNote": "brief reason"}]`;
        }

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        });

        const content = response.choices[0].message.content as string;
        let parsed: unknown;
        try {
          const raw = JSON.parse(content);
          parsed = Array.isArray(raw) ? raw : (raw.scores || raw.data || raw.results || []);
        } catch {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI returned invalid JSON" });
        }

        const scores = parsed as Array<Record<string, unknown>>;
        for (const score of scores) {
          if (input.matrixType === "wsm") {
            await upsertWsmScore({
              projectId: input.projectId,
              startupId: score.startupId as number,
              requirementId: score.requirementId as number,
              aiScore: score.aiScore as number,
              justificationNote: score.justificationNote as string,
            });
          } else if (input.matrixType === "pugh") {
            await upsertPughScore({
              projectId: input.projectId,
              startupId: score.startupId as number,
              requirementId: score.requirementId as number,
              aiScore: score.aiScore as number,
              justificationNote: score.justificationNote as string,
            });
          } else {
            await upsertCapfitScore({
              projectId: input.projectId,
              startupId: score.startupId as number,
              capabilityId: score.capabilityId as number,
              aiScore: score.aiScore as "High" | "Med" | "Low",
              justificationNote: score.justificationNote as string,
            });
          }
        }
        return { success: true, count: scores.length };
      }),
  }),

  // ─── Composite + Rankings ─────────────────────────────────────────────
  rankings: router({
    get: analystProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => getRankings(input.projectId)),

    calculate: analystProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const [reqs, caps, startupList, wsmList, pughList, capfitList] = await Promise.all([
          getRequirements(input.projectId),
          getCapabilities(input.projectId),
          getStartups(input.projectId),
          getWsmScores(input.projectId),
          getPughScores(input.projectId),
          getCapfitScores(input.projectId),
        ]);

        const eligibleStartups = startupList.filter(s => s.eligible);
        const totalWeight = reqs.reduce((sum, r) => sum + (r.weight || 0), 0) || 1;

        const results: Array<{ startupId: number; wsmScore: number; pughNormalized: number; capfitAvg: number; compositeScore: number }> = [];

        for (const startup of eligibleStartups) {
          // WSM: weighted sum of (score * weight / totalWeight)
          let wsmScore = 0;
          for (const req of reqs) {
            const score = wsmList.find(s => s.startupId === startup.id && s.requirementId === req.id);
            const val = score?.humanScore ?? score?.aiScore ?? 0;
            wsmScore += (val * (req.weight / totalWeight));
          }

          // Pugh: sum of scores, normalized to 0-10
          let pughRaw = 0;
          for (const req of reqs) {
            const score = pughList.find(s => s.startupId === startup.id && s.requirementId === req.id);
            pughRaw += (score?.humanScore ?? score?.aiScore ?? 0);
          }
          const maxPugh = reqs.length;
          const pughNormalized = maxPugh > 0 ? ((pughRaw + maxPugh) / (2 * maxPugh)) * 10 : 5;

          // CapFit: average of numeric conversions
          let capfitSum = 0;
          let capfitCount = 0;
          for (const cap of caps) {
            const score = capfitList.find(s => s.startupId === startup.id && s.capabilityId === cap.id);
            if (score) {
              capfitSum += capfitToNum(score.humanScore ?? score.aiScore);
              capfitCount++;
            }
          }
          const capfitAvg = capfitCount > 0 ? (capfitSum / capfitCount) * 10 : 0;

          // Composite: WSM×50% + Pugh×30% + CapFit×20%
          const compositeScore = wsmScore * 0.5 + pughNormalized * 0.3 + capfitAvg * 0.2;

          results.push({ startupId: startup.id, wsmScore, pughNormalized, capfitAvg, compositeScore });
        }

        // Sort by composite score descending
        results.sort((a, b) => b.compositeScore - a.compositeScore);

        // Assign tiers: top 25% = T1, 25-50% = T2, 50-75% = T3, bottom 25% = T4
        const n = results.length;
        for (let i = 0; i < results.length; i++) {
          const pct = n > 1 ? i / (n - 1) : 0;
          const tier = pct < 0.25 ? 1 : pct < 0.5 ? 2 : pct < 0.75 ? 3 : 4;
          await upsertRanking({
            projectId: input.projectId,
            startupId: results[i].startupId,
            rank: i + 1,
            compositeScore: Math.round(results[i].compositeScore * 100) / 100,
            wsmScore: Math.round(results[i].wsmScore * 100) / 100,
            pughNormalized: Math.round(results[i].pughNormalized * 100) / 100,
            capfitAvg: Math.round(results[i].capfitAvg * 100) / 100,
            tier,
          });
        }

        return { success: true, count: results.length };
      }),
  }),

  // ─── Recommendations ─────────────────────────────────────────────────
  recommendations: router({
    list: analystProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => getRecommendations(input.projectId)),

    generateAiDrafts: analystProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const project = await getProject(input.projectId);
        if (!project) throw new TRPCError({ code: "NOT_FOUND" });
        const [startupList, rankingList] = await Promise.all([
          getStartups(input.projectId),
          getRankings(input.projectId),
        ]);

        const eligibleStartups = startupList.filter(s => s.eligible);

        for (const startup of eligibleStartups) {
          const ranking = rankingList.find(r => r.startupId === startup.id);
          const response = await invokeLLM({
            messages: [
              { role: "system", content: "You are a senior innovation consultant writing startup evaluation narratives for corporate clients. Be concise, professional, and evidence-based. 2-3 sentences max." },
              { role: "user", content: `Write a recommendation narrative for ${startup.name} (${startup.tagline || ""}) in the context of ${project.clientName}'s innovation scouting for ${project.industry || "their industry"}. Composite score: ${ranking?.compositeScore?.toFixed(2) ?? "N/A"}/10, Tier ${ranking?.tier ?? "N/A"}. Include a clear recommendation (proceed or not) and the key reason.` },
            ],
          });
          const aiDraft = response.choices[0].message.content as string;
          await upsertRecommendation({
            projectId: input.projectId,
            startupId: startup.id,
            aiDraft,
            narrative: aiDraft,
            decision: ranking?.tier && ranking.tier <= 2 ? "recommended" : "not_recommended",
          });
        }
        return { success: true };
      }),

    update: analystProcedure
      .input(z.object({
        projectId: z.number(),
        startupId: z.number(),
        narrative: z.string().optional(),
        decision: z.enum(["recommended", "not_recommended"]).optional(),
        decisionReason: z.enum(["below_threshold", "geography", "trl", "other"]).optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        await upsertRecommendation(input as Parameters<typeof upsertRecommendation>[0]);
        return { success: true };
      }),
  }),

  // ─── Publish ─────────────────────────────────────────────────────────
  publish: router({
    getLog: analystProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => getPublishLog(input.projectId)),

    toggle: analystProcedure
      .input(z.object({ projectId: z.number(), publish: z.boolean() }))
      .mutation(async ({ input }) => {
        const project = await getProject(input.projectId);
        if (!project) throw new TRPCError({ code: "NOT_FOUND" });
        if (input.publish && !project.passkeyHash) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Set a passkey before publishing" });
        }
        await updateProject(input.projectId, {
          published: input.publish,
          publishedAt: input.publish ? new Date() : undefined,
        });
        await addPublishLog(input.projectId, input.publish ? "published" : "unpublished");
        return { success: true };
      }),
  }),

  // ─── Client Report (public) ───────────────────────────────────────────
  report: router({
    getByPasskey: publicProcedure
      .input(z.object({ projectId: z.number(), passkey: z.string() }))
      .query(async ({ input }) => {
        const project = await getProject(input.projectId);
        if (!project || !project.published) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Report not found or not published" });
        }
        if (!project.passkeyHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "No passkey configured" });
        }
        const valid = await bcrypt.compare(input.passkey, project.passkeyHash);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid passkey" });
        }

        const [reqs, formulaList, clusterList, startupList, capList, wsmList, pughList, capfitList, rankingList, recList] = await Promise.all([
          getRequirements(input.projectId),
          getFormulas(input.projectId),
          getClusters(input.projectId),
          getStartups(input.projectId),
          getCapabilities(input.projectId),
          getWsmScores(input.projectId),
          getPughScores(input.projectId),
          getCapfitScores(input.projectId),
          getRankings(input.projectId),
          getRecommendations(input.projectId),
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
            analystEmail: project.analystEmail,
            analystPhone: project.analystPhone,
            scopeDescription: project.scopeDescription,
            universeSize: project.universeSize,
            eligibleCount: project.eligibleCount,
            excludedCount: project.excludedCount,
            publishedAt: project.publishedAt,
          },
          requirements: reqs,
          formulas: formulaList,
          clusters: clusterList,
          startups: startupList,
          capabilities: capList,
          wsmScores: wsmList,
          pughScores: pughList,
          capfitScores: capfitList,
          rankings: rankingList,
          recommendations: recList,
        };
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

export type AppRouter = typeof appRouter;
