import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ── Test context factories ────────────────────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeCtx(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const clearedCookies: any[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "scout@vclstudio.com",
    name: "Test Scout",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
}

function makeAdminCtx(): TrpcContext {
  return makeCtx({ role: "admin", openId: "admin-user" });
}

function makeUnauthCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

// ── Auth tests ────────────────────────────────────────────────────────────────

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const clearedCookies: any[] = [];
    const ctx: TrpcContext = {
      user: {
        id: 1, openId: "test", email: "t@t.com", name: "T", loginMethod: "manus",
        role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1, httpOnly: true, path: "/" });
  });

  it("auth.me returns null for unauthenticated context", async () => {
    const caller = appRouter.createCaller(makeUnauthCtx());
    const user = await caller.auth.me();
    expect(user).toBeNull();
  });

  it("auth.me returns user for authenticated context", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const user = await caller.auth.me();
    expect(user).not.toBeNull();
    expect(user?.email).toBe("scout@vclstudio.com");
  });
});

// ── Admin guard tests ─────────────────────────────────────────────────────────

describe("admin role guard", () => {
  it("admin.listUsers throws FORBIDDEN for non-admin users", async () => {
    const caller = appRouter.createCaller(makeCtx({ role: "user" }));
    await expect(caller.admin.listUsers()).rejects.toThrow("FORBIDDEN");
  });

  it("admin.promoteUser throws FORBIDDEN for non-admin users", async () => {
    const caller = appRouter.createCaller(makeCtx({ role: "user" }));
    await expect(caller.admin.promoteUser({ userId: 2, role: "admin" })).rejects.toThrow("FORBIDDEN");
  });

  it("admin.deleteTalent throws FORBIDDEN for non-admin users", async () => {
    const caller = appRouter.createCaller(makeCtx({ role: "user" }));
    await expect(caller.admin.deleteTalent({ id: 1 })).rejects.toThrow("FORBIDDEN");
  });
});

// ── Shortlist input validation ────────────────────────────────────────────────

describe("shortlists.create input validation", () => {
  it("rejects empty shortlist name", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.shortlists.create({ name: "" })).rejects.toThrow();
  });
});

// ── Submissions public access ─────────────────────────────────────────────────

describe("submissions.create (public)", () => {
  it("rejects invalid email", async () => {
    const caller = appRouter.createCaller(makeUnauthCtx());
    await expect(
      caller.submissions.create({
        name: "Jane Doe",
        email: "not-an-email",
        discipline: "Acting",
      })
    ).rejects.toThrow();
  });

  it("rejects empty name", async () => {
    const caller = appRouter.createCaller(makeUnauthCtx());
    await expect(
      caller.submissions.create({
        name: "",
        email: "jane@example.com",
        discipline: "Acting",
      })
    ).rejects.toThrow();
  });
});

// ── Notes input validation ────────────────────────────────────────────────────

describe("notes input validation", () => {
  it("notes.create rejects empty note content", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.notes.create({ talentId: 1, note: "" })
    ).rejects.toThrow();
  });

  it("notes.create rejects rating out of range (0)", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.notes.create({ talentId: 1, note: "Great talent", rating: 0 })
    ).rejects.toThrow();
  });

  it("notes.create rejects rating out of range (6)", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.notes.create({ talentId: 1, note: "Great talent", rating: 6 })
    ).rejects.toThrow();
  });
});

// ── Talents input validation ──────────────────────────────────────────────────

describe("talents.upsert input validation", () => {
  it("rejects empty name", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.talents.upsert({ name: "", discipline: "Acting" })
    ).rejects.toThrow();
  });

  it("rejects empty discipline", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.talents.upsert({ name: "Jane Doe", discipline: "" })
    ).rejects.toThrow();
  });

  it("rejects invalid availability enum", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.talents.upsert({
        name: "Jane Doe",
        discipline: "Acting",
        availability: "maybe" as any,
      })
    ).rejects.toThrow();
  });
});

// ── Shortlist token (public) ──────────────────────────────────────────────────

describe("shortlists.getByToken (public)", () => {
  it("throws NOT_FOUND for non-existent token", async () => {
    const caller = appRouter.createCaller(makeUnauthCtx());
    await expect(
      caller.shortlists.getByToken({ token: "nonexistent-token-xyz" })
    ).rejects.toThrow("Shortlist not found");
  });
});
