/**
 * Server-side Configuration for UniFi Access ↔ Jisr Attendance Bridge
 * All credentials, endpoints, and operational parameters are configured here once via environment variables.
 */

export const INTEGRATION_CONFIG = {
  // UniFi Access Configuration
  unifi: {
    baseUrl: process.env.UNIFI_BASE_URL || "https://192.168.1.1:12445",
    apiToken: process.env.UNIFI_API_TOKEN || "",
    webhookSecret: process.env.UNIFI_WEBHOOK_SECRET || "",
    endpoints: {
      users: "/api/v1/developer/users",
      doors: "/api/v1/developer/doors",
      events: "/api/v1/developer/events",
      accessLogs: "/api/v1/developer/logs/access",
    },
  },

  // Jisr HR Open API Configuration
  // AWS: "https://apis.jisr.net/api" | Saudi Local: "https://api.jisr.net.sa/api/"
  jisr: {
    baseUrl: process.env.JISR_BASE_URL || "https://apis.jisr.net/api",
    apiKey: process.env.JISR_API_KEY || "",
    apiSecret: process.env.JISR_API_SECRET || "",
    accessToken: process.env.JISR_ACCESS_TOKEN || "",
    companyId: process.env.JISR_COMPANY_ID || "",
    endpoints: {
      auth: "/auth/token",
      employees: "/employees",
      attendanceLogs: "/attendance/logs",
      createGroupAttendanceLogs: "/attendance/create-group-attendance-log",
    },
  },

  // Operational Rules
  operations: {
    timezone: process.env.DEFAULT_TIMEZONE || "Asia/Riyadh",
    attendanceMode: (process.env.ATTENDANCE_MODE || "RAW") as "RAW" | "DOOR_RULES" | "DIRECTION",
    entryDoorIds: (process.env.ENTRY_DOOR_IDS || "").split(",").map((s) => s.trim()).filter(Boolean),
    exitDoorIds: (process.env.EXIT_DOOR_IDS || "").split(",").map((s) => s.trim()).filter(Boolean),
    allowedEventTypes: (process.env.ALLOWED_EVENT_TYPES || "access.door.unlock, door_unlock, access_granted")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    autoSyncIntervalMinutes: Number(process.env.SYNC_INTERVAL_MINUTES) || 10,
    retryAttempts: 5,
  },
};
