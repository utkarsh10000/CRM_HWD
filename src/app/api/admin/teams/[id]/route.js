import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Team from "@/models/Team";
import Employee from "@/models/Employee";
import Access from "@/models/Access";
import { getSession } from "@/lib/session";

export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { name, memberIds } = body;

  try {
    await dbConnect();

    const team = await Team.findById(id);
    if (!team) {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }

    if (name && name.trim()) {
      team.name = name.trim();
      await team.save();
    }

    if (Array.isArray(memberIds)) {
      // Remove this team from anyone currently on it but not in the new list.
      await Employee.updateMany(
        { teamIds: id, _id: { $nin: memberIds } },
        { $pull: { teamIds: id } }
      );
      // Add this team to everyone newly selected.
      await Employee.updateMany(
        { _id: { $in: memberIds } },
        { $addToSet: { teamIds: id } }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Update team error:", err);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    await dbConnect();

    const deleted = await Team.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }

    await Employee.updateMany({ teamIds: id }, { $pull: { teamIds: id } });
    await Access.deleteMany({ teamId: id });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete team error:", err);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}