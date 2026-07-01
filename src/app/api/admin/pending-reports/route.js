import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import DailyReport from "@/models/DailyReport";
import Employee from "@/models/Employee";
import { getSession } from "@/lib/session";
import { getISTDateString } from "@/lib/istDate";

export async function GET(request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || getISTDateString();
  const employeeId = searchParams.get("employeeId") || "";
  const employeeName = searchParams.get("name") || "";

  await dbConnect();

  const empQuery = {};
  if (employeeId) empQuery.employeeId = { $regex: employeeId, $options: "i" };
  if (employeeName) empQuery.name = { $regex: employeeName, $options: "i" };

  const allEmployees = await Employee.find(empQuery).lean();
  const submitted = await DailyReport.find({ reportDate: date }).select("employeeId").lean();
  const submittedIds = new Set(submitted.map((r) => r.employeeId));

  const pending = allEmployees
    .filter((e) => !submittedIds.has(e.employeeId))
    .map((e) => ({ employeeId: e.employeeId, name: e.name }));

  return NextResponse.json({ date, pending });
}