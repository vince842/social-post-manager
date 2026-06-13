import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  prompt: z.string().min(1).max(2000),
  // Restrict to inline base64 data URLs only — prevents SSRF via arbitrary https URLs
  // being fetched server-side by the AI gateway.
  images: z
    .array(z.string().regex(/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/, "Only base64 image data URLs are allowed"))
    .min(1)
    .max(4),
  count: z.number().int().min(1).max(4).default(3),
});

async function generateOne(apiKey: string, prompt: string, images: string[]): Promise<string> {
  const content: Array<Record<string, unknown>> = [{ type: "text", text: prompt }];
  for (const url of images) {
    content.push({ type: "image_url", image_url: { url } });
  }

  const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3.1-flash-image-preview",
      messages: [{ role: "user", content }],
      modalities: ["image", "text"],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("AI gateway error", res.status, text);
    if (res.status === 429) throw new Error("Rate limit reached. Please try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please try again later.");
    throw new Error("Image generation failed. Please try again.");
  }
  const json = (await res.json()) as { data?: Array<{ b64_json?: string }> };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image returned");
  return `data:image/png;base64,${b64}`;
}

export const generateMergedImages = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const variants = [
      "Photorealistic blend, soft natural lighting, brand photo as the hero subject.",
      "Editorial collage style, layered composition, vibrant brand colors emphasised.",
      "Modern minimalist composite, clean negative space, subtle gradient backdrop.",
    ];

    const results = await Promise.allSettled(
      Array.from({ length: data.count }).map((_, i) =>
        generateOne(
          apiKey,
          `${data.prompt}\n\nVariation direction: ${variants[i % variants.length]}\nKeep the composition square (1:1). Do not add any text or watermarks.`,
          data.images,
        ),
      ),
    );

    const images = results
      .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
      .map((r) => r.value);

    if (images.length === 0) {
      const firstErr = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
      throw new Error(firstErr?.reason?.message ?? "All generations failed");
    }

    return { images };
  });
