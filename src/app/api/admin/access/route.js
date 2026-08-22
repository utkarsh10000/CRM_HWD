import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Access from "@/models/Access";
import Employee from "@/models/Employee";
import Team from "@/models/Team";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  await dbConnect();
  const grants = await Access.find({}).lean();
  const employees = await Employee.find({}).select("employeeId name").lean();
  const teams = await Team.find({}).select("name").lean();

  const empMap = Object.fromEntries(employees.map((e) => [e._id.toString(), e]));
  const teamMap = Object.fromEntries(teams.map((t) => [t._id.toString(), t]));

  const result = grants.map((g) => ({
    id: g._id.toString(),
    granteeId: g.granteeId.toString(),
    granteeName: empMap[g.granteeId.toString()]?.name || "Unknown",
    granteeEmployeeId: empMap[g.granteeId.toString()]?.employeeId || "",
    teamId: g.teamId.toString(),
    teamName: teamMap[g.teamId.toString()]?.name || "Unknown",
    scopes: g.scopes,
  }));

  return NextResponse.json({ access: result });
}

export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { granteeId, teamId, scopes } = body;

  if (!granteeId || !teamId) {
    return NextResponse.json({ error: "Grantee and team are required." }, { status: 400 });
  }

  try {
    await dbConnect();

    if (!Array.isArray(scopes) || scopes.length === 0) {
      await Access.deleteOne({ granteeId, teamId });
      return NextResponse.json({ ok: true, deleted: true });
    }

    const grant = await Access.findOneAndUpdate(
      { granteeId, teamId },
      { $set: { scopes, grantedBy: session._id } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ ok: true, grant });
  } catch (err) {
    console.error("Create/update access grant error:", err);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}