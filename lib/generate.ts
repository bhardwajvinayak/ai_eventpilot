import { AiError, generateWithGemini } from "./ai";
import { generateDemoPlan } from "./demo-plans";
import { generateRequestSchema } from "./schemas";

export const MAX_BODY_BYTES = 20_000;
const PLACEHOLDER_KEY = "your_api_key_here";

export const DEMO_NOTICE =
  "DEMO MODE: this plan was generated locally from templates. No AI model was called and no live data was used.";

export type GenerateResult = { status: number; body: Record<string, unknown> };

export function isKeyConfigured(key: string | undefined): key is string {
  const k = key?.trim();
  return !!k && k !== PLACEHOLDER_KEY;
}

function fail(status: number, code: string, message: string, extra: Record<string, unknown> = {}): GenerateResult {
  return { status, body: { error: { code, message, ...extra } } };
}

/** Framework-independent request handler so it can be tested without starting Next.js. */
export async function handleGenerate(
  rawBody: string,
  env: { GEMINI_API_KEY?: string; GEMINI_MODEL?: string },
  fetchImpl?: typeof fetch,
): Promise<GenerateResult> {
  if (rawBody.length > MAX_BODY_BYTES) return fail(413, "too_large", "The request is too large.");
  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return fail(400, "bad_json", "The request body must be valid JSON.");
  }
  const parsed = generateRequestSchema.safeParse(json);
  if (!parsed.success) {
    return fail(400, "invalid_input", "Some event details are invalid.", {
      issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  const { form, demo } = parsed.data;

  if (demo || !isKeyConfigured(env.GEMINI_API_KEY)) {
    return {
      status: 200,
      body: { source: "demo", plan: generateDemoPlan(form), notice: DEMO_NOTICE, reason: demo ? "requested" : "no_api_key" },
    };
  }

  try {
    const { plan, model } = await generateWithGemini(form, { apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL, fetchImpl });
    return { status: 200, body: { source: "ai", model, plan } };
  } catch (e) {
    if (e instanceof AiError) return fail(e.httpStatus, e.code, e.message);
    return fail(500, "unknown", "Something went wrong while generating the plan.");
  }
}
