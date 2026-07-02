import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import DailyReport from "@/models/DailyReport";
import { getSession } from "@/lib/session";
import { getISTDateString } from "@/lib/istDate";

const FIELDS = [
  "leadsAttended",
  "notConnected",
  "callConnected",
  "visitPlanned",
  "visitManaged",
  "meetingDone",
  "bookingByCp",
  "bookingBySelf",
];

export async function POST(request) {
  const session = await getSession();

  if (!session || session.role !== "employee") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const values = {};
  for (const field of FIELDS) {
    const num = Number(body[field]);
    if (body[field] === undefined || body[field] === "" || Number.isNaN(num) || num < 0) {
      return NextResponse.json({ error: "All fields must be valid numbers." }, { status: 400 });
    }
    values[field] = num;
  }

  const reportDate = getISTDateString();

  try {
    await dbConnect();

    const existing = await DailyReport.findOne({ employeeId: session.employeeId, reportDate });
    if (existing) {
      return NextResponse.json(
        { error: "You've already submitted your report for today." },
        { status: 409 }
      );
    }

    const report = await DailyReport.create({
      employeeId: session.employeeId,
      reportDate,
      ...values,
    });

    return NextResponse.json({ ok: true, report }, { status: 201 });
  } catch (err) {
    // Unique index race: two near-simultaneous submits for the same day.
    if (err.code === 11000) {
      return NextResponse.json(
        { error: "You've already submitted your report for today." },
        { status: 409 }
      );
    }
    console.error("Submit report error:", err);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}