import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Lead from "@/models/Lead";
import Employee from "@/models/Employee";
import { getSession } from "@/lib/session";
import { canAssignLeadTo, buildLeadVisibilityQuery } from "@/lib/leadAccess";

export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { leadIds, mode, employeeId, employeeIds, reason } = body;

  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return NextResponse.json({ error: "Select at least one lead." }, { status: 400 });
  }

  await dbConnect();

  // Resolve which employee each lead goes to, and authorize every distinct
  // target BEFORE touching the database — a single unauthorized target
  // fails the whole request rather than partially assigning leads.
  let targetForIndex;

  if (mode === "single") {
    if (!employeeId) {
      return NextResponse.json({ error: "employeeId is required." }, { status: 400 });
    }
    if (!(await canAssignLeadTo(session, employeeId))) {
      return NextResponse.json({ error: "You are not authorized to assign leads to this employee." }, { status: 403 });
    }
    targetForIndex = () => employeeId;
  } else if (mode === "split") {
    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json({ error: "Select at least one employee to split across." }, { status: 400 });
    }
    for (const eid of employeeIds) {
      if (!(await canAssignLeadTo(session, eid))) {
        return NextResponse.json(
          { error: `You are not authorized to assign leads to ${eid}.` },
          { status: 403 }
        );
      }
    }
    // Round-robin distribution.
    targetForIndex = (i) => employeeIds[i % employeeIds.length];
  } else {
    return NextResponse.json({ error: "Invalid mode." }, { status: 400 });
  }

  const visibilityQuery = await buildLeadVisibilityQuery(session);
  const employeeCache = new Map();

  async function getTeamIdFor(empId) {
    if (employeeCache.has(empId)) return employeeCache.get(empId);
    const emp = await Employee.findOne({ employeeId: empId }).select("teamIds").lean();
    const teamId = emp?.teamIds?.[0] || null;
    employeeCache.set(empId, teamId);
    return teamId;
  }

  const assigned = [];
  const failed = [];

  for (let i = 0; i < leadIds.length; i++) {
    const leadId = leadIds[i];
    const targetEmployeeId = targetForIndex(i);

    try {
      // Re-check visibility per lead — a team leader can only bulk-assign
      // leads that were already visible to them.
      const lead = await Lead.findOne({ _id: leadId, ...visibilityQuery });
      if (!lead) {
        failed.push({ leadId, error: "Not found or not visible to you." });
        continue;
      }

      const teamId = await getTeamIdFor(targetEmployeeId);
      const previousOwner = lead.assignedTo;

      lead.assignedTo = targetEmployeeId;
      lead.teamId = teamId;
      lead.assignmentHistory.push({
        fromEmployeeId: previousOwner,
        toEmployeeId: targetEmployeeId,
        byEmployeeId: session.role === "admin" ? "admin" : session.employeeId,
        byRole: session.role,
        reason: reason || (mode === "split" ? "Bulk split assignment" : "Bulk assignment"),
        at: new Date(),
      });

      await lead.save();
      assigned.push(leadId);
    } catch (err) {
      console.error(`Bulk assign failed for lead ${leadId}:`, err);
      failed.push({ leadId, error: "Something went wrong." });
    }
  }

  return NextResponse.json({ ok: true, assignedCount: assigned.length, failed });
}