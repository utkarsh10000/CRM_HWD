import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import DailyReport from "@/models/DailyReport";
import Employee from "@/models/Employee";
import { getSession } from "@/lib/session";
import { getISTDateString } from "@/lib/istDate";
import { getVisibleEmployeeIds } from "@/lib/access";

export async function GET(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || getISTDateString();
  const employeeId = searchParams.get("employeeId") || "";
  const employeeName = searchParams.get("name") || "";

  await dbConnect();

  const visibleIds = await getVisibleEmployeeIds(session, "dailyReports");
  if (visibleIds !== null && visibleIds.length === 0) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const conditions = [];
  if (employeeId) conditions.push({ employeeId: { $regex: employeeId, $options: "i" } });
  if (employeeName) conditions.push({ name: { $regex: employeeName, $options: "i" } });
  if (visibleIds) conditions.push({ employeeId: { $in: visibleIds } });
  const empQuery = conditions.length === 0 ? {} : conditions.length === 1 ? conditions[0] : { $and: conditions };

  const allEmployees = await Employee.find(empQuery).lean();
  const submitted = await DailyReport.find({ reportDate: date }).select("employeeId").lean();
  const submittedIds = new Set(submitted.map((r) => r.employeeId));

  const pending = allEmployees
    .filter((e) => !submittedIds.has(e.employeeId))
    .map((e) => ({ employeeId: e.employeeId, name: e.name }));

  return NextResponse.json({ date, pending });
}