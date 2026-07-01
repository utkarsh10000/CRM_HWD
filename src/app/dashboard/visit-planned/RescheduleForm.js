"use client";

import { useState } from "react";

export default function RescheduleForm({ visit, onSaved }) {
  const [visitDate, setVisitDate] = useState(visit.visitDate.slice(0, 10));
  const [timeSlot, setTimeSlot] = useState(visit.timeSlot);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!visitDate || !timeSlot) {
      setError("Please fill in both fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/visits/${visit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitDate, timeSlot }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        return;
      }

      onSaved?.();
    } catch (err) {
      console.error("Reschedule failed:", err);
      setError("Couldn't reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="visitDate" className="mb-1.5 block text-sm font-medium text-slate-700">
            Visiting Date
          </label>
          <input
            id="visitDate"
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

        <div>
          <label htmlFor="timeSlot" className="mb-1.5 block text-sm font-medium text-slate-700">
            Time Slot
          </label>
          <input
            id="timeSlot"
            type="text"
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value)}
            placeholder="e.g. 10:00 AM - 11:00 AM"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}