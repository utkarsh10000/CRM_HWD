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

export async function DELETE(request, { params }) {
  const session = await getSession();

  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    await dbConnect();

    const visit = await Visit.findByIdAndDelete(id);

    if (!visit) {
      return NextResponse.json({ error: "Visit not found." }, { status: 404 });
    }

    if (visit.outcome?.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(visit.outcome.imagePublicId);
      } catch (imgErr) {
        console.error("Cloudinary delete error:", imgErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete visit error:", err);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}