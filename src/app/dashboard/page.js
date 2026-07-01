import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import dbConnect from "@/lib/dbConnect";
import Employee from "@/models/Employee";
import LogoutButton from "./LogoutButton";

const EMPLOYEE_OPTIONS = [
  {
    href: "/dashboard/reporting",
    title: "Reporting",
    description: "Submit and view your reports.",
  },
  {
    href: "/dashboard/visit-planned",
    title: "Visit Planned",
    description: "See your upcoming scheduled visits.",
  },
  {
    href: "/dashboard/visit-done",
    title: "Visit Done",
    description: "Review visits you've already completed.",
  },
];

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  if (session.role === "admin") {
    return (
      <main className="flex min-h-screen flex-1 items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">You're signed in</h1>
          <p className="mt-2 text-sm text-slate-500">Signed in as admin.</p>
          <div className="mt-6">
            <LogoutButton />
          </div>
        </div>
      </main>
    );
  }

  await dbConnect();
  const employee = await Employee.findOne({ employeeId: session.employeeId }).lean();
  const displayName = employee?.name || session.employeeId;

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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {EMPLOYEE_OPTIONS.map((option) => (
            <Link
              key={option.href}
              href={option.href}
              className="rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:border-blue-300 hover:bg-blue-50/40"
            >
              <h2 className="text-sm font-semibold text-slate-900">{option.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{option.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}