import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import dbConnect from "@/lib/dbConnect";
import Employee from "@/models/Employee";
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

  const employees = docs.map((e) => ({
    id: e._id.toString(),
    employeeId: e.employeeId,
    name: e.name,
  }));

  return <ManageEmployeesClient employees={employees} />;
}