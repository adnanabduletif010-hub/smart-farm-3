import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const Schema = z.object({
  moisture: z.number().min(0).max(100).nullable().optional(),
  nitrogen: z.number().min(0).max(1000).nullable().optional(),
  phosphorus: z.number().min(0).max(1000).nullable().optional(),
  potassium: z.number().min(0).max(1000).nullable().optional(),
  ph: z.number().min(0).max(14).nullable().optional(),
  temperature: z.number().min(-20).max(80).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Device-Token",
  };
}

export const Route = createFileRoute("/api/public/iot/ingest")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: corsHeaders() }),
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization") ?? "";
        const headerToken =
          request.headers.get("x-device-token") ??
          (auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "");

        if (!headerToken) {
          return Response.json(
            { ok: false, error: "Missing device token" },
            { status: 401, headers: corsHeaders() },
          );
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json(
            { ok: false, error: "Invalid JSON" },
            { status: 400, headers: corsHeaders() },
          );
        }

        const parsed = Schema.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            { ok: false, error: "Invalid payload", issues: parsed.error.issues },
            { status: 400, headers: corsHeaders() },
          );
        }

        const { data: device, error: devErr } = await supabaseAdmin
          .from("iot_device_tokens")
          .select("id, user_id, device_name, field_name")
          .eq("token", headerToken)
          .maybeSingle();

        if (devErr || !device) {
          return Response.json(
            { ok: false, error: "Invalid device token" },
            { status: 401, headers: corsHeaders() },
          );
        }

        const r = parsed.data;
        const { error: insErr } = await supabaseAdmin.from("soil_readings").insert({
          user_id: device.user_id,
          device_name: device.device_name,
          field_name: device.field_name,
          moisture: r.moisture ?? null,
          nitrogen: r.nitrogen ?? null,
          phosphorus: r.phosphorus ?? null,
          potassium: r.potassium ?? null,
          ph: r.ph ?? null,
          temperature: r.temperature ?? null,
          notes: r.notes ?? null,
          source: "device",
        });

        if (insErr) {
          return Response.json(
            { ok: false, error: insErr.message },
            { status: 500, headers: corsHeaders() },
          );
        }

        await supabaseAdmin
          .from("iot_device_tokens")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", device.id);

        return Response.json({ ok: true }, { headers: corsHeaders() });
      },
    },
  },
});
