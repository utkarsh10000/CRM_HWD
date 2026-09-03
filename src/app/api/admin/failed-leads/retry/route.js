import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FailedLeadEvent from "@/models/FailedLeadEvent";
import Lead from "@/models/Lead";
import { getSession } from "@/lib/session";
import { fetchMetaLead, mapMetaFieldData, extractPhone } from "@/lib/meta";

async function retryOne(event) {
  const existing = await Lead.findOne({ "meta.leadgenId": event.leadgenId }).select("_id").lean();
  if (existing) {
    await FailedLeadEvent.updateOne({ _id: event._id }, { $set: { resolved: true } });
    return { leadgenId: event.leadgenId, ok: true, note: "already existed" };
  }

  try {
    const leadData = await fetchMetaLead(event.leadgenId);
    const fields = mapMetaFieldData(leadData.field_data);
    const fullName =
      fields.full_name || [fields.first_name, fields.last_name].filter(Boolean).join(" ") || "Unknown";

    await Lead.create({
      name: fullName,
      firstName: fields.first_name || "",
      lastName: fields.last_name || "",
      phone: extractPhone(fields),
      email: fields.email || "",
      source: "meta",
      status: "new",
      meta: {
        leadgenId: event.leadgenId,
        pageId: event.pageId,
        formId: leadData.form_id || event.formId || "",
        formName: leadData.form_name || "",
        campaignId: leadData.campaign_id || "",
        campaignName: leadData.campaign_name || "",
        adsetId: leadData.adset_id || "",
        adsetName: leadData.adset_name || "",
        adId: leadData.ad_id || "",
        adName: leadData.ad_name || "",
        platform: leadData.platform || "",
        submittedAt: leadData.created_time ? new Date(leadData.created_time * 1000) : new Date(),
        customFields: fields,
      },
    });

    await FailedLeadEvent.updateOne({ _id: event._id }, { $set: { resolved: true } });
    return { leadgenId: event.leadgenId, ok: true };
  } catch (err) {
    await FailedLeadEvent.updateOne(
      { _id: event._id },
      { $set: { error: err.message, errorStatus: err.status || null, lastAttemptAt: new Date() }, $inc: { attempts: 1 } }
    );
    return { leadgenId: event.leadgenId, ok: false, error: err.message };
  }
}

export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  await dbConnect();

  const query = body.leadgenId ? { leadgenId: body.leadgenId } : { resolved: false };
  const events = await FailedLeadEvent.find(query).lean();

  const results = [];
  for (const event of events) {
    results.push(await retryOne(event));
  }

  return NextResponse.json({ retried: results.length, results });
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  await dbConnect();
  const events = await FailedLeadEvent.find({ resolved: false }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({
    events: events.map((e) => ({
      id: e._id.toString(),
      leadgenId: e.leadgenId,
      error: e.error,
      attempts: e.attempts,
      lastAttemptAt: e.lastAttemptAt,
      createdAt: e.createdAt,
    })),
  });
}