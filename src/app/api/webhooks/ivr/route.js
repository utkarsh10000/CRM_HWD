import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Lead from "@/models/Lead";
import { normalizeIvrPayload, extractIvrFields } from "@/lib/ivr";

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!process.env.IVR_WEBHOOK_TOKEN || token !== process.env.IVR_WEBHOOK_TOKEN) {
    console.error("IVR webhook: missing or invalid token.");
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";
  let fields;

  try {
    if (contentType.includes("application/json")) {
      fields = await request.json();
    } else {
      // Covers application/x-www-form-urlencoded and multipart/form-data —
      // matches Voicell's "Payload type: FORM" setting.
      const formData = await request.formData();
      fields = {};
      for (const [key, value] of formData.entries()) fields[key] = value;
    }
  } catch (err) {
    console.error("IVR webhook: failed to parse payload:", err);
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const extracted = extractIvrFields(fields);

  // Fall back to a deterministic hash if Voicell doesn't send a call ID at
  // all, so duplicate deliveries of the same event still dedupe correctly
  // instead of creating a new lead every retry.
  const callId =
    extracted.callId ||
    `${extracted.callerNumber}-${extracted.calledNumber}-${fields.timestamp || fields.start_time || ""}`;

  if (!callId || callId === "--") {
    console.error("IVR webhook: could not determine a call identifier, payload:", fields);
    return NextResponse.json({ error: "Missing call identifier." }, { status: 400 });
  }

  try {
    await dbConnect();

    const existing = await Lead.findOne({ "ivr.callId": callId }).select("_id").lean();
    if (existing) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    await Lead.create({
      name: extracted.callerNumber || "Unknown Caller",
      phone: extracted.callerNumber,
      source: "ivr",
      status: "new",
      ivr: {
        callId,
        callerNumber: extracted.callerNumber,
        calledNumber: extracted.calledNumber,
        callStatus: extracted.callStatus,
        durationSeconds: extracted.durationSeconds,
        recordingUrl: extracted.recordingUrl,
        receivedAt: new Date(),
        raw: fields,
      },
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("IVR webhook: failed to save lead:", err);
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}