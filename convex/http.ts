import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/webhook/unifi",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const rawBody = await request.text();
      const rawPayload = JSON.parse(rawBody);

      const secretHeader =
        request.headers.get("x-webhook-secret") ||
        request.headers.get("x-signature") ||
        request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
        undefined;

      const result = await ctx.runMutation(api.attendance.ingestWebhookEvent, {
        rawPayload,
        webhookSecretHeader: secretHeader,
      });

      if (!result.accepted) {
        return new Response(JSON.stringify(result), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(result), {
        status: 202,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: unknown) {
      const error = err as Error;
      return new Response(
        JSON.stringify({ accepted: false, error: `Invalid payload: ${error.message}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

// Alias path
http.route({
  path: "/api/unifi-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const rawBody = await request.text();
      const rawPayload = JSON.parse(rawBody);

      const secretHeader =
        request.headers.get("x-webhook-secret") ||
        request.headers.get("x-signature") ||
        request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
        undefined;

      const result = await ctx.runMutation(api.attendance.ingestWebhookEvent, {
        rawPayload,
        webhookSecretHeader: secretHeader,
      });

      if (!result.accepted) {
        return new Response(JSON.stringify(result), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(result), {
        status: 202,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: unknown) {
      const error = err as Error;
      return new Response(
        JSON.stringify({ accepted: false, error: `Invalid payload: ${error.message}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

export default http;
