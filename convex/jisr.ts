import { action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { INTEGRATION_CONFIG } from "./config";

export const testConnection = action({
  args: {
    baseUrl: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    apiSecret: v.optional(v.string()),
    accessToken: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const baseUrl = args.baseUrl || INTEGRATION_CONFIG.jisr.baseUrl;
    const apiKey = args.apiKey || INTEGRATION_CONFIG.jisr.apiKey;
    const accessToken = args.accessToken || INTEGRATION_CONFIG.jisr.accessToken;

    try {
      const headers: Record<string, string> = {
        Accept: "application/json",
      };

      if (accessToken) {
        headers["Access-Token"] = accessToken;
        headers["Authorization"] = `Bearer ${accessToken}`;
      } else if (apiKey) {
        headers["api-key"] = apiKey;
      }

      const url = `${baseUrl.replace(/\/$/, "")}${INTEGRATION_CONFIG.jisr.endpoints.employees}?limit=1`;
      const res = await fetch(url, {
        method: "GET",
        headers,
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return {
          success: true,
          message: "Successfully connected to Jisr HR API",
          details: data,
        };
      }
      return {
        success: false,
        message: `Jisr API returned HTTP ${res.status}: ${JSON.stringify(data)}`,
      };
    } catch (err: unknown) {
      const error = err as Error;
      return {
        success: false,
        message: `Failed to connect to Jisr API: ${error.message}`,
      };
    }
  },
});

export const syncEmployees = action({
  args: {},
  handler: async (ctx) => {
    const baseUrl = INTEGRATION_CONFIG.jisr.baseUrl;
    const apiKey = INTEGRATION_CONFIG.jisr.apiKey;
    const accessToken = INTEGRATION_CONFIG.jisr.accessToken;

    if (!baseUrl) {
      return { success: false, message: "Jisr Base URL must be configured in environment" };
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (accessToken) {
      headers["Access-Token"] = accessToken;
      headers["Authorization"] = `Bearer ${accessToken}`;
    } else if (apiKey) {
      headers["api-key"] = apiKey;
    }

    try {
      const url = `${baseUrl.replace(/\/$/, "")}${INTEGRATION_CONFIG.jisr.endpoints.employees}?limit=500`;
      const res = await fetch(url, {
        method: "GET",
        headers,
      });

      const json = await res.json().catch(() => ({}));
      const empList = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];

      await ctx.runMutation(internal.jisr.saveEmployees, {
        employees: empList.map((item: Record<string, unknown>) => ({
          jisrId: String(item.id || item.employee_id || item.code),
          code: (item.code || item.employee_code || item.badge_number) as string | undefined,
          name: String(item.name || item.full_name || `${item.first_name || ""} ${item.last_name || ""}`.trim() || "Unknown"),
          email: (item.email || item.work_email) as string | undefined,
          phone: (item.phone || item.mobile) as string | undefined,
          raw: item,
        })),
      });

      return {
        success: true,
        count: empList.length,
        message: `Successfully synchronized ${empList.length} Jisr employees`,
      };
    } catch (err: unknown) {
      const error = err as Error;
      return {
        success: false,
        message: `Error syncing Jisr employees: ${error.message}`,
      };
    }
  },
});

export const saveEmployees = internalMutation({
  args: {
    employees: v.array(
      v.object({
        jisrId: v.string(),
        code: v.optional(v.string()),
        name: v.string(),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        raw: v.any(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const e of args.employees) {
      const existing = await ctx.db
        .query("jisrEmployees")
        .withIndex("by_jisr_id", (q) => q.eq("jisrId", e.jisrId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...e,
          lastSyncedAt: now,
        });
      } else {
        await ctx.db.insert("jisrEmployees", {
          ...e,
          lastSyncedAt: now,
        });
      }
    }
  },
});
