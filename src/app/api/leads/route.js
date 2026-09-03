import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Lead from "@/models/Lead";
import Employee from "@/models/Employee";
import Team from "@/models/Team";
import { getSession } from "@/lib/session";
import { buildLeadVisibilityQuery, getLeadScope } from "@/lib/leadAccess";

export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  await dbConnect();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";
  const source = searchParams.get("source") || "";
  const campaignId = searchParams.get("campaignId") || "";

  const query = await buildLeadVisibilityQuery(session);
  if (status) query.status = status;
  if (source) query.source = source;
  if (campaignId) query["meta.campaignId"] = campaignId === "unattributed" ? "" : campaignId;

  const leads = await Lead.find(query).sort({ createdAt: -1 }).lean();

  const empIds = [...new Set(leads.map((l) => l.assignedTo).filter(Boolean))];
  const empDocs = await Employee.find({ employeeId: { $in: empIds } }).select("employeeId name").lean();
  const empMap = Object.fromEntries(empDocs.map((e) => [e.employeeId, e.name]));

  const teamIds = [...new Set(leads.map((l) => l.teamId?.toString()).filter(Boolean))];
  const teamDocs = await Team.find({ _id: { $in: teamIds } }).select("name").lean();
  const teamMap = Object.fromEntries(teamDocs.map((t) => [t._id.toString(), t.name]));

  const scope = await getLeadScope(session);

  const result = leads.map((l) => ({
    id: l._id.toString(),
    name: l.name,
    phone: l.phone,
    email: l.email,
    source: l.source,
    status: l.status,
    assignedTo: l.assignedTo || "",
    assignedToName: l.assignedTo ? empMap[l.assignedTo] || l.assignedTo : "Unassigned",
    teamName: l.teamId ? teamMap[l.teamId.toString()] || "" : "",
    campaignId: l.meta?.campaignId || "",
    campaignName: l.meta?.campaignName || "",
    createdAt: l.createdAt,
  }));

  return NextResponse.json({
    leads: result,
    canDistribute: scope.scope === "all" || scope.scope === "led",
  });
}