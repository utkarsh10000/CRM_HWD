import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import DailyReport from "@/models/DailyReport";
import Employee from "@/models/Employee";
import { getSession } from "@/lib/session";
import { getDateRange } from "@/lib/dateRange";
import { getISTDateString } from "@/lib/istDate";

export async function GET(request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "today";
  const customStart = searchParams.get("start");
  const customEnd = searchParams.get("end");
  const employeeId = searchParams.get("employeeId") || "";
  const employeeName = searchParams.get("name") || "";

  const range = getDateRange(filter, customStart, customEnd);
  if (!range) return NextResponse.json({ error: "Invalid date range." }, { status: 400 });

  const startStr = getISTDateString(range.start);
  const endStr = getISTDateString(range.end);

  await dbConnect();

  let allowedIds = null;
  if (employeeId || employeeName) {
    const empQuery = {};
    if (employeeId) empQuery.employeeId = { $regex: employeeId, $options: "i" };
    if (employeeName) empQuery.name = { $regex: employeeName, $options: "i" };
    const emps = await Employee.find(empQuery).select("employeeId").lean();
    allowedIds = emps.map((e) => e.employeeId);
    if (allowedIds.length === 0) return NextResponse.json({ reports: [] });
  }

  const reportQuery = { reportDate: { $gte: startStr, $lte: endStr } };
  if (allowedIds) reportQuery.employeeId = { $in: allowedIds };

  const reports = await DailyReport.find(reportQuery).sort({ reportDate: -1 }).lean();

  const empMap = {};
  const empDocs = await Employee.find({
    employeeId: { $in: [...new Set(reports.map((r) => r.employeeId))] },
  }).lean();
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

  return NextResponse.json({ reports: result });
}