/* eslint-disable */
import type * as attendance from "../attendance.js";
import type * as jisr from "../jisr.js";
import type * as mappings from "../mappings.js";
import type * as settings from "../settings.js";
import type * as unifi from "../unifi.js";
import type { FunctionReference, AnyApi } from "convex/server";

export declare const api: {
  attendance: {
    getStats: FunctionReference<"query", "public", {}, {
      totalEvents: number;
      sentPunches: number;
      pendingPunches: number;
      unmappedEvents: number;
      activeMappings: number;
      totalMappings: number;
    }>;
    listPunches: FunctionReference<"query", "public", { status?: string; limit?: number }, any[]>;
    listEvents: FunctionReference<"query", "public", { status?: string; limit?: number }, any[]>;
    ingestWebhookEvent: FunctionReference<"mutation", "public", { rawPayload: any; webhookSecretHeader?: string }, any>;
    manualRetry: FunctionReference<"action", "public", { punchId: any }, void>;
  };
  mappings: {
    list: FunctionReference<"query", "public", {}, any[]>;
    getUnmappedAndSuggestions: FunctionReference<"query", "public", {}, {
      unmappedUnifi: any[];
      unmappedJisr: any[];
      suggestions: any[];
      totalMapped: number;
      totalUnifi: number;
      totalJisr: number;
    }>;
    saveMapping: FunctionReference<"mutation", "public", {
      unifiUserId: string;
      unifiUserName: string;
      jisrEmployeeId: string;
      jisrEmployeeName: string;
      active: boolean;
    }, any>;
    remove: FunctionReference<"mutation", "public", { id: any }, void>;
    toggleActive: FunctionReference<"mutation", "public", { id: any; active: boolean }, void>;
  };
  settings: {
    get: FunctionReference<"query", "public", {}, any>;
    update: FunctionReference<"mutation", "public", any, any>;
  };
  unifi: {
    testConnection: FunctionReference<"action", "public", { baseUrl: string; apiToken: string }, { success: boolean; message: string; details?: any }>;
    syncUsers: FunctionReference<"action", "public", {}, { success: boolean; message: string; count?: number }>;
  };
  jisr: {
    testConnection: FunctionReference<"action", "public", { baseUrl: string; apiKey?: string; apiSecret?: string; accessToken?: string }, { success: boolean; message: string; details?: any }>;
    syncEmployees: FunctionReference<"action", "public", {}, { success: boolean; message: string; count?: number }>;
  };
};

export declare const internal: {
  attendance: {
    processEventById: FunctionReference<"mutation", "internal", { eventId: any }, void>;
    deliverPunchToJisr: FunctionReference<"action", "internal", { punchId: any }, void>;
    getPunchInternal: FunctionReference<"query", "internal", { punchId: any }, any>;
    getSettingsInternal: FunctionReference<"query", "internal", {}, any>;
    updatePunchStatus: FunctionReference<"mutation", "internal", any, void>;
  };
  unifi: {
    getSettings: FunctionReference<"query", "internal", {}, any>;
    saveUsers: FunctionReference<"mutation", "internal", any, void>;
  };
  jisr: {
    getSettings: FunctionReference<"query", "internal", {}, any>;
    saveEmployees: FunctionReference<"mutation", "internal", any, void>;
  };
};
