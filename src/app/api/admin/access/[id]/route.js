import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Access from "@/models/Access";
import { getSession } from "@/lib/session";

export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    await dbConnect();
    const deleted = await Access.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Grant not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete access grant error:", err);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}