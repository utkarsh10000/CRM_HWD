import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import dbConnect from "@/lib/dbConnect";
import Visit from "@/models/Visit";
import VisitPlannedClient from "./VisitPlannedClient";

export default async function VisitPlannedPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  if (session.role !== "employee") {
    redirect("/dashboard");
  }

  await dbConnect();
  const docs = await Visit.find({ employeeId: session.employeeId, status: "planned" })
    .sort({ createdAt: -1 })
    .lean();

  const visits = docs.map((v) => ({
    id: v._id.toString(),
    name: v.name,
    contact: v.contact,
    project: v.project,
    visitDate: v.visitDate.toISOString(),
    timeSlot: v.timeSlot,
  }));

  return <VisitPlannedClient visits={visits} />;
}