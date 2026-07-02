import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Visit from "@/models/Visit";
import { getSession } from "@/lib/session";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function PATCH(request, { params }) {
  const session = await getSession();

  if (!session || session.role !== "employee") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { visitDate, timeSlot } = body;

  if (!visitDate || !timeSlot) {
    return NextResponse.json({ error: "Date and time slot are required." }, { status: 400 });
  }

  try {
    await dbConnect();

    const visit = await Visit.findById(id);

    // Only let an employee reschedule their own visit.
    if (!visit || visit.employeeId !== session.employeeId) {
      return NextResponse.json({ error: "Visit not found." }, { status: 404 });
    }

    visit.visitDate = new Date(visitDate);
    visit.timeSlot = timeSlot;
    await visit.save();

    return NextResponse.json({ ok: true, visit });
  } catch (err) {
    console.error("Reschedule visit error:", err);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const session = await getSession();

  if (!session || session.role !== "employee") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { handledBy, response, status, remark, imageUrl, imagePublicId } = body;

  if (!handledBy || !response || !status) {
    return NextResponse.json(
      { error: "Handled by, response, and status are required." },
      { status: 400 }
    );
  }

  try {
    await dbConnect();

    const visit = await Visit.findById(id);

    if (!visit || visit.employeeId !== session.employeeId) {
      return NextResponse.json({ error: "Visit not found." }, { status: 404 });
    }

    visit.status = status;
    visit.outcome = {
      handledBy,
      response,
      remark: remark || "",
      imageUrl: imageUrl || "",
      imagePublicId: imagePublicId || "",
      doneAt: new Date(),
    };

    await visit.save();

    return NextResponse.json({ ok: true, visit });
  } catch (err) {
    console.error("Visit done error:", err);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
