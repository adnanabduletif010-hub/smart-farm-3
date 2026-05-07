import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "../../src/lib/firebase-admin";

function corsHeaders(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Device-Token");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  corsHeaders(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers["authorization"] ?? "";
  const headerToken =
    (req.headers["x-device-token"] as string) ??
    (authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "");

  if (!headerToken) return res.status(401).json({ ok: false, error: "Missing device token" });

  const body = req.body;
  if (!body) return res.status(400).json({ ok: false, error: "Invalid payload" });

  try {
    const tokensRef = adminDb.collection("iot_device_tokens");
    const snapshot = await tokensRef.where("token", "==", headerToken).limit(1).get();

    if (snapshot.empty) return res.status(401).json({ ok: false, error: "Invalid device token" });

    const deviceDoc = snapshot.docs[0];
    const device = deviceDoc.data();

    await adminDb.collection("soil_readings").add({
      user_id: device.user_id,
      device_name: device.device_name,
      field_name: device.field_name,
      moisture: body.moisture ?? null,
      nitrogen: body.nitrogen ?? null,
      phosphorus: body.phosphorus ?? null,
      potassium: body.potassium ?? null,
      ph: body.ph ?? null,
      temperature: body.temperature ?? null,
      notes: body.notes ?? null,
      source: "device",
      created_at: new Date().toISOString()
    });

    await deviceDoc.ref.update({ last_used_at: new Date().toISOString() });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("IoT ingest error", e);
    return res.status(500).json({ ok: false, error: e.message || "Failed to store reading" });
  }
}
