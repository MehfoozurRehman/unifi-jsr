export async function generateEventFingerprint(
  externalEventId: string | null | undefined,
  userId: string | null | undefined,
  doorId: string | null | undefined,
  occurredAtMs: number,
  rawPayload: unknown
): Promise<string> {
  const content = externalEventId && externalEventId.trim().length > 0
    ? `id:${externalEventId.trim()}`
    : JSON.stringify({
        userId: userId ?? "",
        doorId: doorId ?? "",
        occurredAt: new Date(occurredAtMs).toISOString(),
        rawPayload,
      });

  const msgBuffer = new TextEncoder().encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
