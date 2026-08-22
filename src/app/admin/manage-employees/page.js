import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import dbConnect from "@/lib/dbConnect";
import Employee from "@/models/Employee";
import Team from "@/models/Team";
import ManageEmployeesClient from "./ManageEmployeesClient";

export default async function ManageEmployeesPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  if (session.role !== "admin") {
    redirect("/dashboard");
  }

  await dbConnect();
  const docs = await Employee.find({}).sort({ employeeId: 1 }).lean();
  const teamDocs = await Team.find({}).sort({ name: 1 }).lean();

  const employees = docs.map((e) => ({
    id: e._id.toString(),
    employeeId: e.employeeId,
    name: e.name,
    role: e.role || "employee",
    teamIds: (e.teamIds || []).map((t) => t.toString()),
  }));

  const teams = teamDocs.map((t) => ({ id: t._id.toString(), name: t.name }));

  return <ManageEmployeesClient employees={employees} teams={teams} />;
}