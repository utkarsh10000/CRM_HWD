import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Lead from "@/models/Lead";
import Employee from "@/models/Employee";
import { getSession } from "@/lib/session";
import { canAssignLeadTo } from "@/lib/leadAccess";

export async function POST(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || !body.employeeId) {
    return NextResponse.json({ error: "employeeId is required." }, { status: 400 });
  }
  const { employeeId, reason } = body;

  // Backend enforcement — this check cannot be bypassed by the frontend
  // hiding the "Assign" button. A tampered request from a normal employee
  // or an out-of-team assignment attempt is rejected here.
  const allowed = await canAssignLeadTo(session, employeeId);
  if (!allowed) {
    return NextResponse.json({ error: "You are not authorized to assign leads to this employee." }, { status: 403 });
  }

  await dbConnect();
  const lead = await Lead.findById(id);
  if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });

  const targetEmployee = await Employee.findOne({ employeeId }).select("teamIds").lean();
  if (!targetEmployee) return NextResponse.json({ error: "Employee not found." }, { status: 404 });

  const previousOwner = lead.assignedTo;

  lead.assignedTo = employeeId;
  lead.teamId = (targetEmployee.teamIds && targetEmployee.teamIds[0]) || null;
  lead.assignmentHistory.push({
    fromEmployeeId: previousOwner,
    toEmployeeId: employeeId,
    byEmployeeId: session.role === "admin" ? "admin" : session.employeeId,
    byRole: session.role,
    reason: reason || "",
    at: new Date(),
  });

  await lead.save();
  return NextResponse.json({ ok: true });
}