import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Visit from "@/models/Visit";
import DailyReport from "@/models/DailyReport";
import Employee from "@/models/Employee";
import { getSession } from "@/lib/session";
import { getDateRange } from "@/lib/dateRange";
import { getISTDateString } from "@/lib/istDate";

export async function GET(request) {
  const session = await getSession();
  if (!session) {
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

  const employees = await Employee.find({ role: { $ne: "admin" } }).select("employeeId name").lean();

  const [visitAgg, reportAgg] = await Promise.all([
    Visit.aggregate([
      { $match: { status: { $ne: "planned" }, createdAt: { $gte: range.start, $lte: range.end } } },
      { $group: { _id: "$employeeId", count: { $sum: 1 } } },
    ]),
    DailyReport.aggregate([
      { $match: { reportDate: { $gte: startStr, $lte: endStr } } },
      {
        $group: {
          _id: "$employeeId",
          bookings: { $sum: { $add: ["$bookingByCp", "$bookingBySelf"] } },
          businessClocked: { $sum: "$businessClocked" },
          meetings: {
            $sum: {
              $add: ["$meetingDoneCp", "$meetingDoneClient", "$meetingDoneInvestor", "$virtualMeeting"],
            },
          },
        },
      },
    ]),
  ]);

  const visitMap = Object.fromEntries(visitAgg.map((v) => [v._id, v.count]));
  const bookingMap = Object.fromEntries(reportAgg.map((r) => [r._id, r.bookings]));
  const businessMap = Object.fromEntries(reportAgg.map((r) => [r._id, r.businessClocked]));
  const meetingsMap = Object.fromEntries(reportAgg.map((r) => [r._id, r.meetings]));

  // Raw per-employee metrics — ranking by a specific metric happens on the
  // client so switching category tabs doesn't need a new request.
  const stats = employees.map((e) => ({
    employeeId: e.employeeId,
    name: e.name,
    visitsDone: visitMap[e.employeeId] || 0,
    businessClocked: businessMap[e.employeeId] || 0,
    bookings: bookingMap[e.employeeId] || 0,
    meetings: meetingsMap[e.employeeId] || 0,
  }));

  return NextResponse.json({
    stats,
    yourEmployeeId: session.employeeId,
  });
}