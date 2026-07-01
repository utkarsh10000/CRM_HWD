"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import VisitPlannedForm from "./VisitPlannedForm";
import RescheduleForm from "./RescheduleForm";
import VisitDoneForm from "./VisitDoneForm";

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function VisitPlannedClient({ visits }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [rescheduleVisit, setRescheduleVisit] = useState(null);
  const [doneVisit, setDoneVisit] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  function handleSaved() {
    setShowForm(false);
    setToast("Visit saved.");
    router.refresh();
  }

  function handleRescheduled() {
    setRescheduleVisit(null);
    setToast("Visit rescheduled.");
    router.refresh();
  }

  function handleDone() {
    setDoneVisit(null);
    setToast("Visit marked as done.");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex-1 bg-slate-50 px-4 py-12">
      <div className="mx-auto w-full max-w-5xl">
        <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-700">
          ← Back to dashboard
        </Link>

        <div className="mt-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Visit Planned</h1>
            <p className="mt-1 text-sm text-slate-500">Your upcoming scheduled visits.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            + Plan Visit
          </button>
        </div>

        {visits.length === 0 ? (
          <p className="mt-10 text-sm text-slate-500">
            No visits planned yet. Click "Plan Visit" to add one.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visits.map((visit) => (
              <div
                key={visit.id}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-center bg-blue-50 py-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-base font-semibold text-white">
                    {visit.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="p-4">
                  <h2 className="text-sm font-semibold text-slate-900">{visit.name}</h2>
                  <p className="mt-0.5 text-sm text-slate-500">{visit.project}</p>
                  <div className="mt-3 space-y-1 text-sm text-slate-700">
                    <p>{visit.contact}</p>
                    <p>
                      {formatDate(visit.visitDate)} · {visit.timeSlot}
                    </p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRescheduleVisit(visit)}
                      className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      Reschedule
                    </button>
                    <button
                      type="button"
                      onClick={() => setDoneVisit(visit)}
                      className="flex-1 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
                    >
                      Visit Done
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-md border border-green-200 bg-white px-4 py-3 text-sm font-medium text-green-700 shadow-lg">
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
          {toast}
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Plan a Visit</h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <VisitPlannedForm onSaved={handleSaved} />
          </div>
        </div>
      )}

      {doneVisit && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setDoneVisit(null)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Mark Visit as Done</h2>
              <button
                type="button"
                onClick={() => setDoneVisit(null)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <VisitDoneForm visit={doneVisit} onSaved={handleDone} />
          </div>
        </div>
      )}

      {rescheduleVisit && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setRescheduleVisit(null)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Reschedule Visit</h2>
              <button
                type="button"
                onClick={() => setRescheduleVisit(null)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <RescheduleForm visit={rescheduleVisit} onSaved={handleRescheduled} />
          </div>
        </div>
      )}
    </main>
  );
}