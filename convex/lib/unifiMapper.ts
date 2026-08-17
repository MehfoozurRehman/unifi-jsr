import { toUtcTimestamp } from "./timezone";

export interface NormalizedUniFiEvent {
  externalEventId?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  doorId?: string;
  doorName?: string;
  deviceId?: string;
  eventType: string;
  direction?: "IN" | "OUT" | "UNKNOWN";
  occurredAt: number; // ms timestamp
  rawPayload: Record<string, unknown>;
}

export class UniFiMapper {
  public static mapToNormalizedEvent(
    payload: Record<string, unknown>
  ): NormalizedUniFiEvent {
    // 1. External Event ID
    const externalEventId = (
      (payload.id as string) ||
      (payload._id as string) ||
      (payload.event_id as string) ||
      (payload.eventId as string) ||
      (payload.log_id as string) ||
      ""
    ).trim() || undefined;

    // 2. User / Actor details
    let userId: string | undefined = undefined;
    let userName: string | undefined = undefined;
    let userEmail: string | undefined = undefined;

    const actor = (payload.actor || payload.user || payload.target) as
      | Record<string, unknown>
      | undefined;

    if (actor && typeof actor === "object") {
      userId = (actor.id || actor._id || actor.user_id || actor.userId) as string || undefined;
      userName = (actor.name || actor.full_name || actor.display_name) as string || undefined;
      userEmail = (actor.email || actor.user_email) as string || undefined;
    } else {
      userId =
        ((payload.user_id || payload.userId || payload.actor_id) as string) || undefined;
      userName =
        ((payload.user_name || payload.userName || payload.actor_name) as string) || undefined;
      userEmail =
        ((payload.user_email || payload.email) as string) || undefined;
    }

    // 3. Door & Device
    let doorId: string | undefined = undefined;
    let doorName: string | undefined = undefined;
    let deviceId: string | undefined = undefined;

    const door = payload.door as Record<string, unknown> | undefined;
    if (door && typeof door === "object") {
      doorId = (door.id || door._id || door.door_id) as string || undefined;
      doorName = (door.name || door.door_name) as string || undefined;
    } else {
      doorId = ((payload.door_id || payload.doorId) as string) || undefined;
      doorName = ((payload.door_name || payload.doorName) as string) || undefined;
    }

    const device = payload.device as Record<string, unknown> | undefined;
    if (device && typeof device === "object") {
      deviceId = (device.id || device.device_id || device.mac) as string || undefined;
    } else {
      deviceId =
        ((payload.device_id || payload.deviceId || payload.reader_id) as string) || undefined;
    }

    // 4. Event Type
    const eventType =
      ((payload.event || payload.event_type || payload.eventType || payload.type) as string) ||
      "access.door.unlock";

    // 5. Direction
    let direction: "IN" | "OUT" | "UNKNOWN" = "UNKNOWN";
    const rawDir =
      ((payload.direction || (door && door.direction) || (payload.data as Record<string, unknown>)?.direction) as string) ||
      "";
    if (rawDir.toUpperCase().includes("IN") || rawDir.toUpperCase() === "ENTRY") {
      direction = "IN";
    } else if (rawDir.toUpperCase().includes("OUT") || rawDir.toUpperCase() === "EXIT") {
      direction = "OUT";
    }

    // 6. Occurred At
    const rawTime =
      payload.timestamp ??
      payload.occurred_at ??
      payload.occurredAt ??
      payload.time ??
      payload.created_at ??
      payload.createdAt ??
      (payload.data as Record<string, unknown>)?.timestamp ??
      Date.now();

    const occurredAt = toUtcTimestamp(rawTime as string | number);

    return {
      externalEventId,
      userId,
      userName,
      userEmail,
      doorId,
      doorName,
      deviceId,
      eventType,
      direction,
      occurredAt,
      rawPayload: payload,
    };
  }
}
