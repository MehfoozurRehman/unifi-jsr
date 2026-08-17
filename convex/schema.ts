import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Global integration settings and credentials
  settings: defineTable({
    // UniFi Configuration
    unifiBaseUrl: v.string(),
    unifiApiToken: v.string(),
    unifiWebhookSecret: v.optional(v.string()),
    
    // Jisr Configuration
    jisrBaseUrl: v.string(), // e.g. "https://apis.jisr.net/api" or "https://api.jisr.net.sa/api"
    jisrApiKey: v.optional(v.string()),
    jisrApiSecret: v.optional(v.string()),
    jisrAccessToken: v.optional(v.string()),
    jisrCompanyId: v.optional(v.string()),

    // Integration Operational Settings
    timezone: v.string(), // e.g. "Asia/Riyadh"
    attendanceMode: v.union(v.literal("RAW"), v.literal("DOOR_RULES"), v.literal("DIRECTION")),
    entryDoorIds: v.array(v.string()),
    exitDoorIds: v.array(v.string()),
    allowedEventTypes: v.array(v.string()),
    autoSyncIntervalMinutes: v.number(),
    updatedAt: v.number(),
  }),

  // Cached UniFi Users
  unifiUsers: defineTable({
    unifiId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    employeeNumber: v.optional(v.string()),
    raw: v.any(),
    lastSyncedAt: v.number(),
  }).index("by_unifi_id", ["unifiId"]),

  // Cached Jisr Employees
  jisrEmployees: defineTable({
    jisrId: v.string(),
    code: v.optional(v.string()),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    raw: v.any(),
    lastSyncedAt: v.number(),
  }).index("by_jisr_id", ["jisrId"]),

  // Employee Mappings (UniFi User <-> Jisr Employee)
  mappings: defineTable({
    unifiUserId: v.string(),
    unifiUserName: v.string(),
    jisrEmployeeId: v.string(),
    jisrEmployeeName: v.string(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_unifi_user", ["unifiUserId"])
    .index("by_jisr_employee", ["jisrEmployeeId"])
    .index("by_active", ["active"]),

  // Ingested UniFi Events (Idempotent Raw Store)
  events: defineTable({
    externalEventId: v.optional(v.string()),
    fingerprint: v.string(), // SHA-256 hash for deduplication
    eventType: v.string(),
    userId: v.optional(v.string()),
    userName: v.optional(v.string()),
    userEmail: v.optional(v.string()),
    doorId: v.optional(v.string()),
    doorName: v.optional(v.string()),
    deviceId: v.optional(v.string()),
    direction: v.optional(v.string()), // "IN", "OUT", "UNKNOWN"
    occurredAt: v.number(), // UTC Timestamp (ms)
    payload: v.any(), // Complete raw webhook payload
    status: v.union(
      v.literal("PENDING"),
      v.literal("PROCESSED"),
      v.literal("UNMAPPED"),
      v.literal("IGNORED"),
      v.literal("FAILED")
    ),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_fingerprint", ["fingerprint"])
    .index("by_status", ["status"])
    .index("by_user_id", ["userId"])
    .index("by_occurred_at", ["occurredAt"]),

  // Attendance Punches queued / delivered to Jisr
  punches: defineTable({
    eventId: v.id("events"),
    unifiUserId: v.string(),
    jisrEmployeeId: v.string(),
    punchType: v.union(v.literal("IN"), v.literal("OUT"), v.literal("RAW")),
    occurredAt: v.number(), // UTC Timestamp (ms)
    timezone: v.string(),
    status: v.union(
      v.literal("PENDING"),
      v.literal("SENT"),
      v.literal("FAILED"),
      v.literal("PERMANENT_FAILURE")
    ),
    attempts: v.number(),
    jisrRequest: v.optional(v.any()),
    jisrResponse: v.optional(v.any()),
    error: v.optional(v.string()),
    sentAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_event_id", ["eventId"])
    .index("by_status", ["status"])
    .index("by_jisr_employee", ["jisrEmployeeId"])
    .index("by_occurred_at", ["occurredAt"]),

  // Sync cursor for UniFi periodic polling reconciliation
  syncCursors: defineTable({
    key: v.string(), // e.g. "unifi_events"
    lastSyncedAt: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
});
