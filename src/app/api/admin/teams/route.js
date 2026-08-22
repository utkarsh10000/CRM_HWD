import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Team from "@/models/Team";
import Employee from "@/models/Employee";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  await dbConnect();
  const teams = await Team.find({}).sort({ name: 1 }).lean();
  const employees = await Employee.find({}).select("employeeId name teamIds").lean();

  const result = teams.map((t) => ({
    id: t._id.toString(),
    name: t.name,
    members: employees
      .filter((e) => (e.teamIds || []).some((tid) => tid.toString() === t._id.toString()))
      .map((e) => ({ id: e._id.toString(), employeeId: e.employeeId, name: e.name })),
  }));

  return NextResponse.json({ teams: result });
}

export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !body.name?.trim()) {
    return NextResponse.json({ error: "Team name is required." }, { status: 400 });
  }

  const { name, memberIds } = body;

  try {
    await dbConnect();

    const existing = await Team.findOne({ name: name.trim() });
    if (existing) {
      return NextResponse.json({ error: "A team with this name already exists." }, { status: 409 });
    }

    const team = await Team.create({ name: name.trim() });

    if (Array.isArray(memberIds) && memberIds.length > 0) {
      await Employee.updateMany(
        { _id: { $in: memberIds } },
        { $addToSet: { teamIds: team._id } }
      );
    }

    return NextResponse.json({ ok: true, team }, { status: 201 });
  } catch (err) {
    console.error("Create team error:", err);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}