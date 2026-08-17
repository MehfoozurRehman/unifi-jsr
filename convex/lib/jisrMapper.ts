import { formatForJisr } from "./timezone";

export interface JisrPunchInput {
  employeeId: string;
  occurredAt: number;
  timezone: string;
  punchType: "IN" | "OUT" | "RAW";
  source?: string;
  sourceDevice?: string;
  sourceDoor?: string;
  externalEventId?: string;
}

export class JisrMapper {
  public static mapPunchesToJisrLogs(punches: JisrPunchInput[]): Record<string, unknown> {
    const logs = punches.map((punch) => {
      const { timestampIso, localDate, localTime, localDateTime } = formatForJisr(
        punch.occurredAt,
        punch.timezone || "Asia/Riyadh"
      );

      return {
        employee_id: punch.employeeId,
        punch_time: timestampIso,
        date: localDate,
        time: localTime,
        date_time: localDateTime,
        type: punch.punchType === "RAW" ? undefined : punch.punchType.toLowerCase(),
        source: punch.source || "UniFi Access",
        device: punch.sourceDevice || punch.sourceDoor || undefined,
        external_id: punch.externalEventId || undefined,
      };
    });

    return {
      attendance_logs: logs,
      logs: logs,
    };
  }
}
