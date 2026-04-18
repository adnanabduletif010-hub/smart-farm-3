import { createServerFn } from "@tanstack/react-start";

type DiagnoseInput = { imageBase64: string; crop?: string; mimeType?: string };

type DiagnoseResult = {
  ok: true;
  disease: string;
  confidence: string;
  severity: string;
  scientific_solution: string;
  home_remedy: string;
  prevention: string;
  is_plant: boolean;
} | { ok: false; error: string };

const SYSTEM = `You are an expert agronomist and plant pathologist helping smallholder farmers.
Analyze the uploaded crop/leaf photo. Identify any disease, pest or deficiency.
Always respond by calling the function 'report_diagnosis'. Be practical, concise, farmer-friendly.
Provide BOTH a scientific/commercial treatment AND a low-cost home remedy that uses common kitchen/farm items
(neem, garlic, baking soda, ash, soap, milk, compost tea, etc.) for farmers without access to chemical products.
If the image is not a plant, set is_plant=false and explain briefly.`;

export const diagnoseCrop = createServerFn({ method: "POST" })
  .inputValidator((d: DiagnoseInput) => {
    if (!d?.imageBase64 || typeof d.imageBase64 !== "string") {
      throw new Error("imageBase64 required");
    }
    return {
      imageBase64: d.imageBase64,
      crop: (d.crop ?? "").slice(0, 80),
      mimeType: d.mimeType ?? "image/jpeg",
    };
  })
  .handler(async ({ data }): Promise<DiagnoseResult> => {
    const KEY = process.env.LOVABLE_API_KEY;
    if (!KEY) return { ok: false, error: "AI not configured" };

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Crop hint: ${data.crop || "unknown"}. Diagnose this plant photo.`,
                },
                {
                  type: "image_url",
                  image_url: { url: `data:${data.mimeType};base64,${data.imageBase64}` },
                },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "report_diagnosis",
                description: "Return a structured diagnosis for the crop photo.",
                parameters: {
                  type: "object",
                  properties: {
                    is_plant: { type: "boolean" },
                    disease: { type: "string", description: "Common disease/pest/deficiency name, or 'Healthy', or 'Unknown'." },
                    confidence: { type: "string", enum: ["low", "medium", "high"] },
                    severity: { type: "string", enum: ["none", "mild", "moderate", "severe"] },
                    scientific_solution: { type: "string", description: "Recommended chemical/commercial treatment with active ingredient and dosage." },
                    home_remedy: { type: "string", description: "Low-cost natural remedy using common items farmers already have." },
                    prevention: { type: "string", description: "Cultural & preventive practices going forward." },
                  },
                  required: [
                    "is_plant", "disease", "confidence", "severity",
                    "scientific_solution", "home_remedy", "prevention",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "report_diagnosis" } },
        }),
      });

      if (!res.ok) {
        if (res.status === 429) return { ok: false, error: "Too many requests, try again in a minute." };
        if (res.status === 402) return { ok: false, error: "AI credits exhausted. Add credits in Workspace > Usage." };
        const t = await res.text();
        console.error("AI gateway error", res.status, t);
        return { ok: false, error: "AI service error" };
      }

      const json = await res.json();
      const tc = json?.choices?.[0]?.message?.tool_calls?.[0];
      if (!tc?.function?.arguments) return { ok: false, error: "No diagnosis returned" };
      const args = JSON.parse(tc.function.arguments);
      return { ok: true, ...args };
    } catch (e) {
      console.error("diagnoseCrop failed", e);
      return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
    }
  });
