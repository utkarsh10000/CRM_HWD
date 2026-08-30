import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Lead from "@/models/Lead";
import Employee from "@/models/Employee";
import { getSession } from "@/lib/session";
import { buildLeadVisibilityQuery } from "@/lib/leadAccess";

export async function GET(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const { id } = await params;
  await dbConnect();

  const visibilityQuery = await buildLeadVisibilityQuery(session);
  const lead = await Lead.findOne({ _id: id, ...visibilityQuery }).lean();
  if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });

  const empIds = [
    ...new Set(
      [lead.assignedTo, ...lead.assignmentHistory.flatMap((h) => [h.fromEmployeeId, h.toEmployeeId, h.byEmployeeId])].filter(
        (id) => id && id !== "admin"
      )
    ),
  ];
  const empDocs = await Employee.find({ employeeId: { $in: empIds } }).select("employeeId name").lean();
  const nameOf = (id) => (id === "admin" ? "Admin" : empDocs.find((e) => e.employeeId === id)?.name || id || "—");

  return NextResponse.json({
    lead: {
      ...lead,
      id: lead._id.toString(),
      assignedToName: nameOf(lead.assignedTo),
      assignmentHistory: lead.assignmentHistory.map((h) => ({
        ...h,
        fromName: nameOf(h.fromEmployeeId),
        toName: nameOf(h.toEmployeeId),
        byName: nameOf(h.byEmployeeId),
      })),
    },
  });
}

// Status/notes updates — any employee who can see this lead may work on it,
// per section 8 ("update status, add notes" is not a distribution action).
export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  await dbConnect();
  const visibilityQuery = await buildLeadVisibilityQuery(session);
  const lead = await Lead.findOne({ _id: id, ...visibilityQuery });
  if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });

  const { status, note } = body;
  if (status) lead.status = status;
  if (note && note.trim()) {
    lead.notes.push({ text: note.trim(), byEmployeeId: session.employeeId || "admin" });
  }

  await lead.save();
  return NextResponse.json({ ok: true });
}