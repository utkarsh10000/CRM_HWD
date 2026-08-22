import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import dbConnect from "@/lib/dbConnect";
import Team from "@/models/Team";
import Employee from "@/models/Employee";
import ManageTeamsClient from "./ManageTeamsClient";

export default async function ManageTeamsPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  await dbConnect();
  const teams = await Team.find({}).sort({ name: 1 }).lean();
  const employees = await Employee.find({})
    .select("employeeId name teamIds")
    .sort({ employeeId: 1 })
    .lean();

  const teamsData = teams.map((t) => ({
    id: t._id.toString(),
    name: t.name,
    memberIds: employees
      .filter((e) => (e.teamIds || []).some((tid) => tid.toString() === t._id.toString()))
      .map((e) => e._id.toString()),
  }));

  const employeesData = employees.map((e) => ({
    id: e._id.toString(),
    employeeId: e.employeeId,
    name: e.name,
  }));

  return <ManageTeamsClient teams={teamsData} employees={employeesData} />;
}