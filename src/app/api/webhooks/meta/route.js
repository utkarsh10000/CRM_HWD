import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/dbConnect";
import Lead from "@/models/Lead";
import FailedLeadEvent from "@/models/FailedLeadEvent";
import { fetchMetaLead, mapMetaFieldData, extractPhone } from "@/lib/meta";

// Meta's created_time can arrive as either an ISO string ("2026-09-06T11:28:00+0000")
// or, in some tools/testing payloads, a raw Unix timestamp number. Handle both
// so a format mismatch never causes Mongoose validation to silently drop the lead.
function parseMetaTimestamp(value) {
  if (!value) return new Date();
  if (typeof value === "number") {
    const d = new Date(value * 1000);
    return isNaN(d.valueOf()) ? new Date() : d;
  }
  const d = new Date(value);
  return isNaN(d.valueOf()) ? new Date() : d;
}

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
    return false;
  }
}

async function saveLeadFromGraphData(leadgenId, pageId, leadData) {
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
        formId: leadData.form_id || "",
        formName: leadData.form_name || "",
        campaignId: leadData.campaign_id || "",
        campaignName: leadData.campaign_name || "",
        adsetId: leadData.adset_id || "",
        adsetName: leadData.adset_name || "",
        adId: leadData.ad_id || "",
        adName: leadData.ad_name || "",
        platform: leadData.platform || "",
        submittedAt: parseMetaTimestamp(leadData.created_time),
        customFields: fields,
      },
    });
  } catch (err) {
    if (err.code === 11000) return; // duplicate — already saved, fine
    throw err;
  }
}

async function processLead({ leadgenId, pageId, formId, createdTime }) {
  const existing = await Lead.findOne({ "meta.leadgenId": leadgenId }).select("_id").lean();
  if (existing) return;

  try {
    const leadData = await fetchMetaLead(leadgenId);
    await saveLeadFromGraphData(leadgenId, pageId, leadData);

    // If a previous attempt had failed and was recorded, mark it resolved
    // now that it succeeded on retry.
    await FailedLeadEvent.updateOne({ leadgenId }, { $set: { resolved: true } });
  } catch (err) {
    // Never let a Graph API failure (expired token, rate limit, transient
    // network issue) silently delete the lead. Persist it so it can be
    // retried automatically or manually — this is what actually caused
    // leads to go missing before, regardless of which campaign they came
    // from.
    console.error(`Meta webhook: failed to process leadgen_id ${leadgenId}:`, err);

    await FailedLeadEvent.findOneAndUpdate(
      { leadgenId },
      {
        $set: {
          pageId,
          formId: formId || "",
          createdTime,
          error: err.message,
          errorStatus: err.status || null,
          lastAttemptAt: new Date(),
        },
        $inc: { attempts: 1 },
      },
      { upsert: true }
    );
  }
}

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

        await processLead({ leadgenId, pageId, formId, createdTime });
      }
    }
  } catch (err) {
    console.error("Meta webhook: processing error:", err);
  }

  // Always 200 to Meta — failures are now durably recorded above and
  // retried separately, rather than relying on Meta's retry behavior
  // (which can eventually disable the subscription on repeated failures).
  return NextResponse.json({ received: true });
}