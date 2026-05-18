import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function makeCtx(role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@vcl.studio",
      name: "Test User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("auth.me", () => {
  it("returns the current user when authenticated", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const me = await caller.auth.me();
    expect(me?.id).toBe(1);
    expect(me?.role).toBe("user");
  });

  it("returns null when not authenticated", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const me = await caller.auth.me();
    expect(me).toBeNull();
  });
});

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const cleared: string[] = [];
    const ctx: TrpcContext = {
      user: makeCtx().user,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: (name: string) => { cleared.push(name); },
      } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(cleared).toHaveLength(1);
  });
});

describe("admin guard", () => {
  it("throws FORBIDDEN for non-admin users on admin.listUsers", async () => {
    const ctx = makeCtx("user");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.listUsers()).rejects.toThrow();
  });
});
