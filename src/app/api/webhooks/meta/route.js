import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/dbConnect";
import Lead from "@/models/Lead";
import { fetchMetaLead, mapMetaFieldData, extractPhone } from "@/lib/meta";

// --- Webhook verification (Meta calls this once when you set up the subscription) ---
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Verification failed." }, { status: 403 });
}

function verifySignature(rawBody, signatureHeader) {
  if (!signatureHeader || !process.env.META_APP_SECRET) return false;
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", process.env.META_APP_SECRET).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  } catch {
    return false; // length mismatch etc. — treat as invalid, not a crash
  }
}

async function processLead({ leadgenId, pageId, formId, createdTime }) {
  const existing = await Lead.findOne({ "meta.leadgenId": leadgenId }).select("_id").lean();
  if (existing) return; // duplicate delivery — no-op, per spec section 4

  const leadData = await fetchMetaLead(leadgenId);
  const fields = mapMetaFieldData(leadData.field_data);

  const fullName =
    fields.full_name || [fields.first_name, fields.last_name].filter(Boolean).join(" ") || "Unknown";

  try {
    await Lead.create({
      name: fullName,
      firstName: fields.first_name || "",
      lastName: fields.last_name || "",
      phone: extractPhone(fields),
      email: fields.email || "",
      source: "meta",
      status: "new",
      meta: {
        leadgenId,
        pageId,
        formId: formId || leadData.form_id || "",
        formName: leadData.ad_name || "",
        submittedAt: createdTime ? new Date(createdTime * 1000) : new Date(),
        customFields: fields,
      },
    });
  } catch (err) {
    // Race: two near-simultaneous deliveries for the same leadgen_id.
    if (err.code === 11000) return;
    throw err;
  }
}

// --- Actual lead events ---
export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifySignature(rawBody, signature)) {
    console.error("Meta webhook: invalid or missing signature.");
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  try {
    await dbConnect();
    for (const entry of payload.entry || []) {
      const pageId = entry.id;
      for (const change of entry.changes || []) {
        if (change.field !== "leadgen") continue;
        const { leadgen_id: leadgenId, form_id: formId, created_time: createdTime } = change.value || {};
        if (!leadgenId) continue;

        try {
          await processLead({ leadgenId, pageId, formId, createdTime });
        } catch (err) {
          // Log and continue — one bad lead must not drop the rest of the batch.
          console.error(`Meta webhook: failed to process leadgen_id ${leadgenId}:`, err);
        }
      }
    }
  } catch (err) {
    console.error("Meta webhook: processing error:", err);
  }

  // Meta expects a fast 200 regardless, or it retries aggressively and can
  // eventually disable the subscription.
  return NextResponse.json({ received: true });
}