import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import dbConnect from "@/lib/dbConnect";
import Employee from "@/models/Employee";
import Access from "@/models/Access";
import LogoutButton from "./LogoutButton";
import NavLinks from "./NavLinks";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  if (session.role === "admin") {
    redirect("/admin");
  }

  await dbConnect();
  const employee = await Employee.findOne({ employeeId: session.employeeId }).lean();
  const displayName = employee?.name || session.employeeId;
  const hasTeamAccess = employee
    ? await Access.exists({ granteeId: employee._id })
    : false;

  return (
    <main className="min-h-screen flex-1 bg-slate-50 px-4 py-12">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Welcome, {displayName}
            </h1>
            <p className="mt-1 text-sm text-slate-500">What would you like to do?</p>
          </div>
          <LogoutButton />
        </div>

        <NavLinks />

        {hasTeamAccess && (
          <div className="mt-4">
            <Link
              href="/dashboard/team-view"
              className="block rounded-lg border border-blue-200 bg-blue-50/40 p-5 hover:border-blue-300 hover:bg-blue-50"
            >
              <h3 className="text-sm font-semibold text-slate-900">Team View</h3>
              <p className="mt-1 text-sm text-slate-500">See daily reports and visits for your assigned team(s).</p>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}