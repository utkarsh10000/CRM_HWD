import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Employee from "@/models/Employee";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  await dbConnect();
  const employees = await Employee.find({}).sort({ employeeId: 1 }).lean();

  const result = employees.map((e) => ({
    id: e._id.toString(),
    employeeId: e.employeeId,
    name: e.name,
  }));

  return NextResponse.json({ employees: result });
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

  const { name, employeeId, password } = body;

  if (!name || !employeeId || !password) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  try {
    await dbConnect();

    const existing = await Employee.findOne({ employeeId });
    if (existing) {
      return NextResponse.json({ error: "An employee with this ID already exists." }, { status: 409 });
    }

    const employee = await Employee.create({ name, employeeId, password });

    return NextResponse.json({ ok: true, employee }, { status: 201 });
  } catch (err) {
    console.error("Create employee error:", err);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}