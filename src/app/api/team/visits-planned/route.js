import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Visit from "@/models/Visit";
import Employee from "@/models/Employee";
import { getSession } from "@/lib/session";
import { getDateRange } from "@/lib/dateRange";
import { getVisibleEmployeeIds } from "@/lib/access";

export async function GET(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  await dbConnect();
  const visibleIds = await getVisibleEmployeeIds(session, "visitsPlanned");
  const hasTeamAccess = visibleIds === null || visibleIds.length > 1;

  if (!hasTeamAccess) {
    return NextResponse.json({ visits: [], hasTeamAccess: false });
  }

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "today";
  const customStart = searchParams.get("start");
  const customEnd = searchParams.get("end");
  const project = searchParams.get("project") || "";

  const range = getDateRange(filter, customStart, customEnd);
  if (!range) return NextResponse.json({ error: "Invalid date range." }, { status: 400 });

  const visitQuery = {
    status: "planned",
    visitDate: { $gte: range.start, $lte: range.end },
  };
  if (visibleIds) visitQuery.employeeId = { $in: visibleIds };
  if (project) visitQuery.project = project;

  const visits = await Visit.find(visitQuery).sort({ visitDate: 1 }).lean();

  const empDocs = await Employee.find({
    employeeId: { $in: [...new Set(visits.map((v) => v.employeeId))] },
  }).lean();
  const empMap = {};
  empDocs.forEach((e) => (empMap[e.employeeId] = e.name));

  const result = visits.map((v) => ({
    id: v._id.toString(),
    employeeId: v.employeeId,
    name: empMap[v.employeeId] || v.employeeId,
    clientName: v.name,
    contact: v.contact,
    project: v.project,
    visitDate: v.visitDate.toISOString().slice(0, 10),
    timeSlot: v.timeSlot,
  }));

  return NextResponse.json({ visits: result, hasTeamAccess: true });
}