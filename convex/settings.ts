import { query } from "./_generated/server";
import { INTEGRATION_CONFIG } from "./config";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const dbSettings = await ctx.db.query("settings").first();
    return {
      unifiBaseUrl: INTEGRATION_CONFIG.unifi.baseUrl || dbSettings?.unifiBaseUrl,
      unifiApiToken: INTEGRATION_CONFIG.unifi.apiToken || dbSettings?.unifiApiToken,
      unifiWebhookSecret: INTEGRATION_CONFIG.unifi.webhookSecret || dbSettings?.unifiWebhookSecret,
      jisrBaseUrl: INTEGRATION_CONFIG.jisr.baseUrl || dbSettings?.jisrBaseUrl,
      jisrApiKey: INTEGRATION_CONFIG.jisr.apiKey || dbSettings?.jisrApiKey,
      jisrApiSecret: INTEGRATION_CONFIG.jisr.apiSecret || dbSettings?.jisrApiSecret,
      jisrAccessToken: INTEGRATION_CONFIG.jisr.accessToken || dbSettings?.jisrAccessToken,
      jisrCompanyId: INTEGRATION_CONFIG.jisr.companyId || dbSettings?.jisrCompanyId,
      timezone: INTEGRATION_CONFIG.operations.timezone,
      attendanceMode: INTEGRATION_CONFIG.operations.attendanceMode,
      entryDoorIds: INTEGRATION_CONFIG.operations.entryDoorIds,
      exitDoorIds: INTEGRATION_CONFIG.operations.exitDoorIds,
      allowedEventTypes: INTEGRATION_CONFIG.operations.allowedEventTypes,
      autoSyncIntervalMinutes: INTEGRATION_CONFIG.operations.autoSyncIntervalMinutes,
      updatedAt: Date.now(),
    };
  },
});
