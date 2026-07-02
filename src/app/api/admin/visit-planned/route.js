import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Visit from "@/models/Visit";
import Employee from "@/models/Employee";
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
  const employeeId = searchParams.get("employeeId") || "";
  const employeeName = searchParams.get("name") || "";
  const project = searchParams.get("project") || "";

  const range = getDateRange(filter, customStart, customEnd);
  if (!range) return NextResponse.json({ error: "Invalid date range." }, { status: 400 });

  await dbConnect();

  let allowedIds = null;
  if (employeeId || employeeName) {
    const empQuery = {};
    if (employeeId) empQuery.employeeId = { $regex: employeeId, $options: "i" };
    if (employeeName) empQuery.name = { $regex: employeeName, $options: "i" };
    const emps = await Employee.find(empQuery).select("employeeId").lean();
    allowedIds = emps.map((e) => e.employeeId);
    if (allowedIds.length === 0) return NextResponse.json({ visits: [] });
  }

  const visitQuery = {
    status: "planned",
    visitDate: { $gte: range.start, $lte: range.end },
  };
  if (allowedIds) visitQuery.employeeId = { $in: allowedIds };
  if (project) visitQuery.project = project;

  const visits = await Visit.find(visitQuery).sort({ visitDate: 1 }).lean();

  const empMap = {};
  const empDocs = await Employee.find({
    employeeId: { $in: [...new Set(visits.map((v) => v.employeeId))] },
  }).lean();
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

  return NextResponse.json({ visits: result });
}