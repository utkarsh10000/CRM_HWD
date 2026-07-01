import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import dbConnect from "@/lib/dbConnect";
import DailyReport from "@/models/DailyReport";
import { getISTDateString } from "@/lib/istDate";
import ReportForm from "./ReportForm";

export default async function ReportingPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  if (session.role !== "employee") {
    redirect("/dashboard");
  }

  await dbConnect();
  const reportDate = getISTDateString();
  const existing = await DailyReport.findOne({
    employeeId: session.employeeId,
    reportDate,
  }).lean();

  const todayLabel = new Date(`${reportDate}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <main className="min-h-screen flex-1 bg-slate-50 px-4 py-12">
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-700">
          ← Back to dashboard
        </Link>

        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <h1 className="text-lg font-semibold text-slate-900">Reporting</h1>
          <p className="mt-1 text-sm text-slate-500">{todayLabel}</p>

          {existing ? (
            <div className="mt-6 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700">
              <svg
                className="h-5 w-5 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>
              Your report has been submitted for today. You can submit again tomorrow.
            </div>
          ) : (
            <ReportForm />
          )}
        </div>
      </div>
    </main>
  );
}