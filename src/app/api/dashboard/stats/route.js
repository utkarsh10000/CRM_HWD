import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Visit from "@/models/Visit";
import Lead from "@/models/Lead";
import DailyReport from "@/models/DailyReport";
import { getSession } from "@/lib/session";
import { getDateRange } from "@/lib/dateRange";
import { getISTDateString } from "@/lib/istDate";

export async function GET(request) {
  const session = await getSession();
  if (!session || session.role === "admin") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "thismonth";
  const customStart = searchParams.get("start");
  const customEnd = searchParams.get("end");

  const range = getDateRange(filter, customStart, customEnd);
  if (!range) return NextResponse.json({ error: "Invalid date range." }, { status: 400 });

  const startStr = getISTDateString(range.start);
  const endStr = getISTDateString(range.end);

  await dbConnect();

  const [visitPlanned, visitDone, leadsAssigned, bookingAgg] = await Promise.all([
    Visit.countDocuments({
      employeeId: session.employeeId,
      status: "planned",
      visitDate: { $gte: range.start, $lte: range.end },
    }),
    Visit.countDocuments({
      employeeId: session.employeeId,
      status: { $ne: "planned" },
      createdAt: { $gte: range.start, $lte: range.end },
    }),
    Lead.countDocuments({
      assignedTo: session.employeeId,
      createdAt: { $gte: range.start, $lte: range.end },
    }),
    DailyReport.aggregate([
      {
        $match: {
          employeeId: session.employeeId,
          reportDate: { $gte: startStr, $lte: endStr },
        },
      },
      {
        $group: {
          _id: null,
          totalBooking: { $sum: { $add: ["$bookingByCp", "$bookingBySelf"] } },
        },
      },
    ]),
  ]);

  const totalBooking = bookingAgg[0]?.totalBooking || 0;

  return NextResponse.json({ visitPlanned, visitDone, leadsAssigned, totalBooking });
}