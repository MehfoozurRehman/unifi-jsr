import { action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { INTEGRATION_CONFIG } from "./config";

export const testConnection = action({
  args: {
    baseUrl: v.optional(v.string()),
    apiToken: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const baseUrl = args.baseUrl || INTEGRATION_CONFIG.unifi.baseUrl;
    const apiToken = args.apiToken || INTEGRATION_CONFIG.unifi.apiToken;

    if (!baseUrl || !apiToken) {
      return {
        success: false,
        message: "Missing UniFi Base URL or API Token in configuration",
      };
    }

    try {
      const url = `${baseUrl.replace(/\/$/, "")}${INTEGRATION_CONFIG.unifi.endpoints.doors}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          Accept: "application/json",
        },
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return {
          success: true,
          message: "Successfully connected to UniFi Access API",
          details: data,
        };
      }
      return {
        success: false,
        message: `UniFi API returned HTTP ${res.status}: ${JSON.stringify(data)}`,
      };
    } catch (err: unknown) {
      const error = err as Error;
      return {
        success: false,
        message: `Failed to connect to UniFi Console: ${error.message}`,
      };
    }
  },
});

export const syncUsers = action({
  args: {},
  handler: async (ctx) => {
    const baseUrl = INTEGRATION_CONFIG.unifi.baseUrl;
    const apiToken = INTEGRATION_CONFIG.unifi.apiToken;

    if (!baseUrl || !apiToken) {
      return { success: false, message: "UniFi Base URL and API Token must be set in environment config" };
    }

    try {
      const url = `${baseUrl.replace(/\/$/, "")}${INTEGRATION_CONFIG.unifi.endpoints.users}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          Accept: "application/json",
        },
      });

      const json = await res.json().catch(() => ({}));
      const userList = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];

      await ctx.runMutation(internal.unifi.saveUsers, {
        users: userList.map((item: Record<string, unknown>) => ({
          unifiId: String(item.id || item._id || item.user_id),
          name: String(item.name || item.full_name || `${item.first_name || ""} ${item.last_name || ""}`.trim() || "Unknown"),
          email: (item.email || item.user_email) as string | undefined,
          employeeNumber: (item.employee_number || item.employee_id) as string | undefined,
          raw: item,
        })),
      });

      return {
        success: true,
        count: userList.length,
        message: `Successfully synchronized ${userList.length} UniFi users`,
      };
    } catch (err: unknown) {
      const error = err as Error;
      return {
        success: false,
        message: `Error syncing UniFi users: ${error.message}`,
      };
    }
  },
});

export const saveUsers = internalMutation({
  args: {
    users: v.array(
      v.object({
        unifiId: v.string(),
        name: v.string(),
        email: v.optional(v.string()),
        employeeNumber: v.optional(v.string()),
        raw: v.any(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const u of args.users) {
      const existing = await ctx.db
        .query("unifiUsers")
        .withIndex("by_unifi_id", (q) => q.eq("unifiId", u.unifiId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...u,
          lastSyncedAt: now,
        });
      } else {
        await ctx.db.insert("unifiUsers", {
          ...u,
          lastSyncedAt: now,
        });
      }
    }
  },
});
