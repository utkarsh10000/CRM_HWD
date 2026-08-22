import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import DailyReport from "@/models/DailyReport";
import Employee from "@/models/Employee";
import { getSession } from "@/lib/session";
import { getDateRange } from "@/lib/dateRange";
import { getISTDateString } from "@/lib/istDate";
import { getVisibleEmployeeIds } from "@/lib/access";

export async function GET(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  await dbConnect();
  const visibleIds = await getVisibleEmployeeIds(session, "dailyReports");
  const hasTeamAccess = visibleIds === null || visibleIds.length > 1;

  if (!hasTeamAccess) {
    return NextResponse.json({ reports: [], hasTeamAccess: false });
  }

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "today";
  const customStart = searchParams.get("start");
  const customEnd = searchParams.get("end");

  const range = getDateRange(filter, customStart, customEnd);
  if (!range) return NextResponse.json({ error: "Invalid date range." }, { status: 400 });

  const startStr = getISTDateString(range.start);
  const endStr = getISTDateString(range.end);

  const reportQuery = { reportDate: { $gte: startStr, $lte: endStr } };
  if (visibleIds) reportQuery.employeeId = { $in: visibleIds };

  const reports = await DailyReport.find(reportQuery).sort({ reportDate: -1 }).lean();

  const empDocs = await Employee.find({
    employeeId: { $in: [...new Set(reports.map((r) => r.employeeId))] },
  }).lean();
  const empMap = {};
  empDocs.forEach((e) => (empMap[e.employeeId] = e.name));

  const result = reports.map((r) => ({
    id: r._id.toString(),
    employeeId: r.employeeId,
    name: empMap[r.employeeId] || r.employeeId,
    reportDate: r.reportDate,
    leadsAttended: r.leadsAttended,
    notConnected: r.notConnected,
    visitPlanned: r.visitPlanned,
    visitManaged: r.visitManaged,
    meetingDone: r.meetingDone,
    bookingByCp: r.bookingByCp,
    bookingBySelf: r.bookingBySelf,
    callConnected: r.callConnected,
  }));

  return NextResponse.json({ reports: result, hasTeamAccess: true });
}