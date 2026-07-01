"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const FIELDS = [
  { key: "leadsAttended", label: "Leads Attended" },
  { key: "notConnected", label: "Not Connected" },
  { key: "visitPlanned", label: "Visit Planned" },
  { key: "visitManaged", label: "Visit Managed" },
  { key: "meetingDone", label: "Meeting Done" },
  { key: "bookingByCp", label: "Booking Done by CP" },
  { key: "bookingBySelf", label: "Booking Done by Self" },
];

const EMPTY_VALUES = FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: "" }), {});

export default function ReportForm() {
  const router = useRouter();
  const [values, setValues] = useState(EMPTY_VALUES);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    for (const field of FIELDS) {
      if (values[field.key] === "" || Number(values[field.key]) < 0) {
        setError("Please fill in all fields with a valid number.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        return;
      }

      router.refresh();
    } catch (err) {
      console.error("Submit report failed:", err);
      setError("Couldn't reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.key}>
            <label
              htmlFor={field.key}
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              {field.label}
            </label>
            <input
              id={field.key}
              type="number"
              min="0"
              inputMode="numeric"
              value={values[field.key]}
              onChange={(e) => handleChange(field.key, e.target.value)}
              onWheel={(e) => e.target.blur()}
              placeholder="0"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
        ))}
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
        {submitting ? "Submitting…" : "Submit report"}
      </button>
    </form>
  );
}