"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import VisitDoneForm from "../visit-planned/VisitDoneForm";
import AddVisitDoneForm from "./AddVisitDoneForm";

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STATUS_STYLES = {
  visited: { label: "Visited", className: "bg-blue-50 text-blue-700" },
  interested: { label: "Interested", className: "bg-green-50 text-green-700" },
  not_interested: { label: "Not Interested", className: "bg-red-50 text-red-700" },
  follow_up: { label: "Follow-up Required", className: "bg-yellow-50 text-yellow-700" },
  revisit_requested: { label: "Revisit Requested", className: "bg-purple-50 text-purple-700" },
  closed: { label: "Closed", className: "bg-slate-100 text-slate-600" },
};

const RESPONSE_LABELS = {
  interested: "Interested",
  not_interested: "Not Interested",
  confused: "Confused",
  time_taking: "Taking Time / Thinking",
  asking_for_revisit: "Asking for Revisit",
  asked_to_call_back: "Asked to Call Back",
  negotiating_price: "Negotiating Price",
  already_has_provider: "Already Has a Provider",
  decision_maker_unavailable: "Decision Maker Not Available",
  follow_up_scheduled: "Follow-up Scheduled",
  not_reachable: "Not Reachable",
  will_think_and_revert: "Will Think & Revert",
};

export default function VisitDoneClient({ visits }) {
  const router = useRouter();
  const [editVisit, setEditVisit] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  function handleUpdated() {
    setEditVisit(null);
    setToast("Visit outcome updated.");
    router.refresh();
  }

  function handleAdded() {
    setShowAddForm(false);
    setToast("Visit saved.");
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
            <h1 className="text-lg font-semibold text-slate-900">Completed Visits</h1>
            <p className="mt-1 text-sm text-slate-500">All visits that have been marked as done.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            + Add Visit
          </button>
        </div>

        {visits.length === 0 ? (
          <p className="mt-10 text-sm text-slate-500">
            No completed visits yet. Mark a visit as done from Visit Planned.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visits.map((visit) => {
              const statusStyle = STATUS_STYLES[visit.status] || STATUS_STYLES.visited;
              return (
                <div
                  key={visit.id}
                  className="overflow-hidden rounded-lg border border-slate-200 bg-white transition-shadow hover:shadow-md"
                >
                  {/* Top — image or avatar */}
                  <div className="relative flex items-center justify-center bg-blue-50 h-36 overflow-hidden">
                    {visit.outcome?.imageUrl ? (
                      <img
                        src={visit.outcome.imageUrl}
                        alt={`Visit with ${visit.name}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-base font-semibold text-white">
                        {visit.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    {/* Status badge overlaid on image */}
                    <span
                      className={`absolute top-2 right-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle.className}`}
                    >
                      {statusStyle.label}
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
                      {visit.outcome?.handledBy && (
                        <p className="text-slate-500">
                          Handled by: <span className="font-medium text-slate-700">{visit.outcome.handledBy}</span>
                        </p>
                      )}
                      {visit.outcome?.response && (
                        <p className="text-slate-500">
                          Response: <span className="font-medium text-slate-700">{RESPONSE_LABELS[visit.outcome.response] || visit.outcome.response}</span>
                        </p>
                      )}
                      {visit.outcome?.remark && (
                        <p className="mt-1 text-xs text-slate-400 italic line-clamp-2">
                          "{visit.outcome.remark}"
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditVisit(visit)}
                      className="mt-3 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      Update Outcome
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-md border border-green-200 bg-white px-4 py-3 text-sm font-medium text-green-700 shadow-lg">
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
              clipRule="evenodd"
            />
          </svg>
          {toast}
        </div>
      )}

      {showAddForm && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setShowAddForm(false)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Add Completed Visit</h2>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <AddVisitDoneForm onSaved={handleAdded} />
          </div>
        </div>
      )}

      {editVisit && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setEditVisit(null)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Update Outcome</h2>
              <button
                type="button"
                onClick={() => setEditVisit(null)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <VisitDoneForm visit={editVisit} onSaved={handleUpdated} />
          </div>
        </div>
      )}
    </main>
  );
}