import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Visit from "@/models/Visit";
import { getSession } from "@/lib/session";

export async function POST(request) {
  const session = await getSession();

  if (!session || session.role !== "employee") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { name, contact, project, visitDate, timeSlot } = body;

  if (!name || !contact || !project || !visitDate || !timeSlot) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  try {
    await dbConnect();

    const visit = await Visit.create({
      employeeId: session.employeeId,
      name,
      contact,
      project,
      visitDate: new Date(visitDate),
      timeSlot,
      status: "planned",
    });

    return NextResponse.json({ ok: true, visit }, { status: 201 });
  } catch (err) {
    console.error("Create visit error:", err);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await getSession();

  if (!session || session.role !== "employee") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { name, contact, project, visitDate, timeSlot, handledBy, response, status, remark, imageUrl, imagePublicId } = body;

  if (!name || !contact || !project || !visitDate || !timeSlot || !handledBy || !response || !status) {
    return NextResponse.json({ error: "All required fields must be filled." }, { status: 400 });
  }

  try {
    await dbConnect();

    const visit = await Visit.create({
      employeeId: session.employeeId,
      name,
      contact,
      project,
      visitDate: new Date(visitDate),
      timeSlot,
      status,
      outcome: {
        handledBy,
        response,
        remark: remark || "",
        imageUrl: imageUrl || "",
        imagePublicId: imagePublicId || "",
        doneAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, visit }, { status: 201 });
  } catch (err) {
    console.error("Create done visit error:", err);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}