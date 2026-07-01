import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import dbConnect from "@/lib/dbConnect";
import Visit from "@/models/Visit";
import VisitDoneClient from "./VisitDoneClient";

export default async function VisitDonePage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  if (session.role !== "employee") {
    redirect("/dashboard");
  }

  await dbConnect();
  const docs = await Visit.find({
    employeeId: session.employeeId,
    status: { $ne: "planned" },
  })
    .sort({ updatedAt: -1 })
    .lean();

  const visits = docs.map((v) => ({
    id: v._id.toString(),
    name: v.name,
    contact: v.contact,
    project: v.project,
    visitDate: v.visitDate.toISOString(),
    timeSlot: v.timeSlot,
    status: v.status,
    outcome: v.outcome
      ? {
          handledBy: v.outcome.handledBy || "",
          response: v.outcome.response || "",
          remark: v.outcome.remark || "",
          imageUrl: v.outcome.imageUrl || "",
          doneAt: v.outcome.doneAt ? v.outcome.doneAt.toISOString() : null,
        }
      : null,
  }));

  return <VisitDoneClient visits={visits} />;
}