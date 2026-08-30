import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Employee from "@/models/Employee";
import { getSession } from "@/lib/session";
import { getLeadScope } from "@/lib/leadAccess";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  await dbConnect();
  const scope = await getLeadScope(session);

  let query;
  if (scope.scope === "all") query = {};
  else if (scope.scope === "led") query = { teamIds: { $in: scope.teamIds } };
  else return NextResponse.json({ employees: [] }); // no distribution rights → empty list

  const employees = await Employee.find(query).select("employeeId name").sort({ employeeId: 1 }).lean();
  return NextResponse.json({ employees: employees.map((e) => ({ employeeId: e.employeeId, name: e.name })) });
}