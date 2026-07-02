import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Visit from "@/models/Visit";
import { getSession } from "@/lib/session";
import { getDateRange } from "@/lib/dateRange";

export async function GET(request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "today";
  const customStart = searchParams.get("start");
  const customEnd = searchParams.get("end");

  const range = getDateRange(filter, customStart, customEnd);
  if (!range) return NextResponse.json({ error: "Invalid date range." }, { status: 400 });

  await dbConnect();

  const [planned, done] = await Promise.all([
    Visit.countDocuments({ status: "planned", visitDate: { $gte: range.start, $lte: range.end } }),
    Visit.countDocuments({ status: { $ne: "planned" }, createdAt: { $gte: range.start, $lte: range.end } }),
  ]);

  return NextResponse.json({ planned, done });
}