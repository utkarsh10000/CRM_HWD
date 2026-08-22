import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import dbConnect from "@/lib/dbConnect";
import Access from "@/models/Access";
import Team from "@/models/Team";
import Employee from "@/models/Employee";
import ManageAccessClient from "./ManageAccessClient";

export default async function ManageAccessPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  await dbConnect();
  const grants = await Access.find({}).lean();
  const teams = await Team.find({}).select("name").sort({ name: 1 }).lean();
  const grantees = await Employee.find({ role: { $ne: "admin" } })
    .select("employeeId name role")
    .sort({ employeeId: 1 })
    .lean();

  const empMap = {};
  grantees.forEach((e) => (empMap[e._id.toString()] = e));
  const teamMap = {};
  teams.forEach((t) => (teamMap[t._id.toString()] = t));

  const accessData = grants.map((g) => ({
    id: g._id.toString(),
    granteeId: g.granteeId.toString(),
    granteeName: empMap[g.granteeId.toString()]?.name || "Unknown",
    granteeEmployeeId: empMap[g.granteeId.toString()]?.employeeId || "",
    teamId: g.teamId.toString(),
    teamName: teamMap[g.teamId.toString()]?.name || "Unknown",
    scopes: g.scopes,
  }));

  const granteesData = grantees.map((e) => ({
    id: e._id.toString(),
    employeeId: e.employeeId,
    name: e.name,
    role: e.role || "employee",
  }));

  const teamsData = teams.map((t) => ({ id: t._id.toString(), name: t.name }));

  return <ManageAccessClient access={accessData} grantees={granteesData} teams={teamsData} />;
}