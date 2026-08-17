import { action, internalAction, internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { UniFiMapper } from "./lib/unifiMapper";
import { generateEventFingerprint } from "./lib/fingerprint";
import { JisrMapper } from "./lib/jisrMapper";
import { Id } from "./_generated/dataModel";
import { INTEGRATION_CONFIG } from "./config";

const RETRY_DELAYS_MS = [
  30 * 1000,       // Attempt 1: 30s
  2 * 60 * 1000,   // Attempt 2: 2m
  10 * 60 * 1000,  // Attempt 3: 10m
  30 * 60 * 1000,  // Attempt 4: 30m
];

// Query Live Stats for Dashboard
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const [events, punches, mappings] = await Promise.all([
      ctx.db.query("events").collect(),
      ctx.db.query("punches").collect(),
      ctx.db.query("mappings").collect(),
    ]);

    const totalEvents = events.length;
    const sentPunches = punches.filter((p) => p.status === "SENT").length;
    const pendingPunches = punches.filter((p) => p.status === "PENDING" || p.status === "FAILED").length;
    const unmappedEvents = events.filter((e) => e.status === "UNMAPPED").length;
    const activeMappings = mappings.filter((m) => m.active).length;

    return {
      totalEvents,
      sentPunches,
      pendingPunches,
      unmappedEvents,
      activeMappings,
      totalMappings: mappings.length,
    };
  },
});

// Query Punch Feed
export const listPunches = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const punches = await ctx.db.query("punches").order("desc").take(limit);

    if (args.status && args.status !== "ALL") {
      return punches.filter((p) => p.status === args.status);
    }
    return punches;
  },
});

// Query Event Feed
export const listEvents = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const events = await ctx.db.query("events").order("desc").take(limit);

    if (args.status && args.status !== "ALL") {
      return events.filter((e) => e.status === args.status);
    }
    return events;
  },
});

// Ingest webhook payload (called from HTTP action or simulator)
export const ingestWebhookEvent = mutation({
  args: {
    rawPayload: v.any(),
    webhookSecretHeader: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate webhook if secret configured
    const expectedSecret = INTEGRATION_CONFIG.unifi.webhookSecret;
    if (expectedSecret && expectedSecret.trim().length > 0) {
      if (args.webhookSecretHeader !== expectedSecret) {
        return { accepted: false, error: "Unauthorized webhook signature or secret" };
      }
    }

    // 2. Normalize event
    const normalized = UniFiMapper.mapToNormalizedEvent(args.rawPayload);

    // 3. Deduplicate via Fingerprint
    const fingerprint = await generateEventFingerprint(
      normalized.externalEventId,
      normalized.userId,
      normalized.doorId,
      normalized.occurredAt,
      args.rawPayload
    );

    const existing = await ctx.db
      .query("events")
      .withIndex("by_fingerprint", (q) => q.eq("fingerprint", fingerprint))
      .first();

    if (existing) {
      return {
        accepted: true,
        duplicate: true,
        eventId: existing._id,
        message: "Duplicate event acknowledged and ignored",
      };
    }

    // 4. Insert new Event
    const eventId = await ctx.db.insert("events", {
      externalEventId: normalized.externalEventId,
      fingerprint,
      eventType: normalized.eventType,
      userId: normalized.userId,
      userName: normalized.userName,
      userEmail: normalized.userEmail,
      doorId: normalized.doorId,
      doorName: normalized.doorName,
      deviceId: normalized.deviceId,
      direction: normalized.direction,
      occurredAt: normalized.occurredAt,
      payload: args.rawPayload,
      status: "PENDING",
      createdAt: Date.now(),
    });

    // 5. Schedule immediate event processing
    await ctx.scheduler.runAfter(0, internal.attendance.processEventById, { eventId });

    return {
      accepted: true,
      duplicate: false,
      eventId,
      message: "Event accepted for processing",
    };
  },
});

// Process an event: Check rules, find employee mapping, generate punch record
export const processEventById = internalMutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return;

    const timezone = INTEGRATION_CONFIG.operations.timezone || "Asia/Riyadh";

    // 1. Check allowed event types
    const allowedTypes = INTEGRATION_CONFIG.operations.allowedEventTypes;
    if (allowedTypes && allowedTypes.length > 0) {
      const allowed = allowedTypes.some(
        (t: string) => t.toLowerCase() === event.eventType.toLowerCase()
      );
      if (!allowed) {
        await ctx.db.patch(event._id, {
          status: "IGNORED",
          error: `Event type ${event.eventType} not in allowed list`,
        });
        return;
      }
    }

    // 2. Check User ID
    if (!event.userId) {
      await ctx.db.patch(event._id, {
        status: "IGNORED",
        error: "No userId found in UniFi payload",
      });
      return;
    }

    // 3. Resolve Mapping
    const mapping = await ctx.db
      .query("mappings")
      .withIndex("by_unifi_user", (q) => q.eq("unifiUserId", event.userId!))
      .first();

    if (!mapping || !mapping.active) {
      await ctx.db.patch(event._id, {
        status: "UNMAPPED",
        error: `UniFi user ${event.userName || event.userId} has no active Jisr mapping`,
      });
      return;
    }

    // 4. Determine Punch Type (RAW, IN, OUT)
    let punchType: "IN" | "OUT" | "RAW" = "RAW";
    const mode = INTEGRATION_CONFIG.operations.attendanceMode;
    if (mode === "DOOR_RULES") {
      if (event.doorId && INTEGRATION_CONFIG.operations.entryDoorIds.includes(event.doorId)) {
        punchType = "IN";
      } else if (event.doorId && INTEGRATION_CONFIG.operations.exitDoorIds.includes(event.doorId)) {
        punchType = "OUT";
      }
    } else if (mode === "DIRECTION") {
      if (event.direction === "IN") punchType = "IN";
      else if (event.direction === "OUT") punchType = "OUT";
    }

    // 5. Create or Get Punch
    const existingPunch = await ctx.db
      .query("punches")
      .withIndex("by_event_id", (q) => q.eq("eventId", event._id))
      .first();

    let punchId: Id<"punches">;
    if (existingPunch) {
      punchId = existingPunch._id;
    } else {
      punchId = await ctx.db.insert("punches", {
        eventId: event._id,
        unifiUserId: event.userId,
        jisrEmployeeId: mapping.jisrEmployeeId,
        punchType,
        occurredAt: event.occurredAt,
        timezone,
        status: "PENDING",
        attempts: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    await ctx.db.patch(event._id, {
      status: "PROCESSED",
      error: undefined,
    });

    // Schedule delivery to Jisr
    await ctx.scheduler.runAfter(0, internal.attendance.deliverPunchToJisr, { punchId });
  },
});

// Deliver punch to Jisr API with auto-retries
export const deliverPunchToJisr = internalAction({
  args: { punchId: v.id("punches") },
  handler: async (ctx, args) => {
    const punch = await ctx.runQuery(internal.attendance.getPunchInternal, {
      punchId: args.punchId,
    });

    if (!punch || punch.status === "SENT") return;

    const jisrBaseUrl = INTEGRATION_CONFIG.jisr.baseUrl;
    if (!jisrBaseUrl) {
      await ctx.runMutation(internal.attendance.updatePunchStatus, {
        punchId: args.punchId,
        status: "FAILED",
        error: "Jisr API URL is not configured in environment",
        attempts: punch.attempts + 1,
      });
      return;
    }

    const payload = JisrMapper.mapPunchesToJisrLogs([
      {
        employeeId: punch.jisrEmployeeId,
        occurredAt: punch.occurredAt,
        timezone: punch.timezone,
        punchType: punch.punchType,
        source: "UniFi Access",
      },
    ]);

    const newAttempts = punch.attempts + 1;
    const authHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (INTEGRATION_CONFIG.jisr.accessToken) {
      authHeaders["Access-Token"] = INTEGRATION_CONFIG.jisr.accessToken;
      authHeaders["Authorization"] = `Bearer ${INTEGRATION_CONFIG.jisr.accessToken}`;
    } else if (INTEGRATION_CONFIG.jisr.apiKey) {
      authHeaders["api-key"] = INTEGRATION_CONFIG.jisr.apiKey;
    }

    try {
      const endpoint = `${jisrBaseUrl.replace(/\/$/, "")}${INTEGRATION_CONFIG.jisr.endpoints.createGroupAttendanceLogs}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      const responseJson = await response.json().catch(() => ({}));

      if (response.ok) {
        await ctx.runMutation(internal.attendance.updatePunchStatus, {
          punchId: args.punchId,
          status: "SENT",
          sentAt: Date.now(),
          attempts: newAttempts,
          jisrRequest: payload,
          jisrResponse: responseJson,
        });
        return;
      }

      // Handle HTTP Errors
      const isRetryable = response.status === 429 || response.status >= 500;
      const isPermanent = !isRetryable || newAttempts >= 5;

      const nextStatus = isPermanent ? "PERMANENT_FAILURE" : "FAILED";
      const errorMsg = `Jisr HTTP ${response.status}: ${JSON.stringify(responseJson)}`;

      await ctx.runMutation(internal.attendance.updatePunchStatus, {
        punchId: args.punchId,
        status: nextStatus,
        attempts: newAttempts,
        jisrRequest: payload,
        jisrResponse: responseJson,
        error: errorMsg,
      });

      if (!isPermanent) {
        const delayIdx = Math.min(newAttempts - 1, RETRY_DELAYS_MS.length - 1);
        const delayMs = RETRY_DELAYS_MS[Math.max(0, delayIdx)];

        await ctx.scheduler.runAfter(delayMs, internal.attendance.deliverPunchToJisr, {
          punchId: args.punchId,
        });
      }
    } catch (err: unknown) {
      const error = err as Error;
      const isPermanent = newAttempts >= 5;
      const nextStatus = isPermanent ? "PERMANENT_FAILURE" : "FAILED";

      await ctx.runMutation(internal.attendance.updatePunchStatus, {
        punchId: args.punchId,
        status: nextStatus,
        attempts: newAttempts,
        jisrRequest: payload,
        error: `Network error contacting Jisr: ${error.message}`,
      });

      if (!isPermanent) {
        const delayIdx = Math.min(newAttempts - 1, RETRY_DELAYS_MS.length - 1);
        const delayMs = RETRY_DELAYS_MS[Math.max(0, delayIdx)];

        await ctx.scheduler.runAfter(delayMs, internal.attendance.deliverPunchToJisr, {
          punchId: args.punchId,
        });
      }
    }
  },
});

// Manual 1-click retry triggered by dashboard user
export const manualRetry = action({
  args: { punchId: v.id("punches") },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.attendance.updatePunchStatus, {
      punchId: args.punchId,
      status: "PENDING",
      error: undefined,
      attempts: 0,
    });

    await ctx.scheduler.runAfter(0, internal.attendance.deliverPunchToJisr, {
      punchId: args.punchId,
    });
  },
});

// Helper internal queries and mutations
export const getPunchInternal = query({
  args: { punchId: v.id("punches") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.punchId);
  },
});

export const getSettingsInternal = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("settings").first();
  },
});

export const updatePunchStatus = internalMutation({
  args: {
    punchId: v.id("punches"),
    status: v.union(
      v.literal("PENDING"),
      v.literal("SENT"),
      v.literal("FAILED"),
      v.literal("PERMANENT_FAILURE")
    ),
    sentAt: v.optional(v.number()),
    attempts: v.number(),
    jisrRequest: v.optional(v.any()),
    jisrResponse: v.optional(v.any()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.punchId, {
      status: args.status,
      sentAt: args.sentAt,
      attempts: args.attempts,
      jisrRequest: args.jisrRequest,
      jisrResponse: args.jisrResponse,
      error: args.error,
      updatedAt: Date.now(),
    });
  },
});
