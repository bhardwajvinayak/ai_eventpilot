import { handleGenerate } from "../../../lib/generate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The API key is read from process.env here on the server only. It is never sent to the browser.
export async function POST(req: Request) {
  const raw = await req.text();
  const result = await handleGenerate(raw, {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
  });
  return Response.json(result.body, { status: result.status, headers: { "Cache-Control": "no-store" } });
}
