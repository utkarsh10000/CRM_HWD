"use client";

import { useState } from "react";

const PROJECT_OPTIONS = ["Expressway Residency", "Haute World City", "Haute-1st-Avenue", "Vision - 2028"];

const RESPONSE_OPTIONS = [
  { value: "interested", label: "Interested" },
  { value: "not_interested", label: "Not Interested" },
  { value: "confused", label: "Confused" },
  { value: "time_taking", label: "Taking Time / Thinking" },
  { value: "asking_for_revisit", label: "Asking for Revisit" },
  { value: "asked_to_call_back", label: "Asked to Call Back" },
  { value: "negotiating_price", label: "Negotiating Price" },
  { value: "already_has_provider", label: "Already Has a Provider" },
  { value: "decision_maker_unavailable", label: "Decision Maker Not Available" },
  { value: "follow_up_scheduled", label: "Follow-up Scheduled" },
  { value: "not_reachable", label: "Not Reachable" },
  { value: "will_think_and_revert", label: "Will Think & Revert" },
];

const STATUS_OPTIONS = [
  { value: "visited", label: "Visited" },
  { value: "interested", label: "Interested" },
  { value: "not_interested", label: "Not Interested" },
  { value: "follow_up", label: "Follow-up Required" },
  { value: "revisit_requested", label: "Revisit Requested" },
  { value: "closed", label: "Closed" },
];

export default function AddVisitDoneForm({ onSaved }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [project, setProject] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [handledBy, setHandledBy] = useState("");
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState("visited");
  const [remark, setRemark] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name || !contact || !project || !visitDate || !timeSlot) {
      setError("Please fill in all visit details.");
      return;
    }
    if (!handledBy.trim()) {
      setError("Please enter who handled the visit.");
      return;
    }
    if (!response) {
      setError("Please select a client response.");
      return;
    }

    setSubmitting(true);

    try {
      let imageUrl = "";
      let imagePublicId = "";

      if (imageFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", imageFile);

        const uploadRes = await fetch("/api/visits/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        setUploading(false);

        if (!uploadRes.ok) {
          setError(uploadData.error || "Image upload failed.");
          setSubmitting(false);
          return;
        }

        imageUrl = uploadData.imageUrl;
        imagePublicId = uploadData.imagePublicId;
      }

      const res = await fetch("/api/visits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, contact, project, visitDate, timeSlot,
          handledBy, response, status, remark, imageUrl, imagePublicId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        return;
      }

      onSaved?.();
    } catch (err) {
      console.error("Add done visit error:", err);
      setError("Couldn't reach the server. Try again.");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>

      {/* Visit Details Section */}
      <div className="rounded-md bg-slate-50 p-3">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Visit Details</p>
        <div className="space-y-3">
          <div>
            <label htmlFor="add-name" className="mb-1.5 block text-sm font-medium text-slate-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="add-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contact person's name"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          <div>
            <label htmlFor="add-contact" className="mb-1.5 block text-sm font-medium text-slate-700">
              Contact <span className="text-red-500">*</span>
            </label>
            <input
              id="add-contact"
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Phone number or email"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          <div>
            <label htmlFor="add-project" className="mb-1.5 block text-sm font-medium text-slate-700">
              Project <span className="text-red-500">*</span>
            </label>
            <select
              id="add-project"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="">Select a project…</option>
              {PROJECT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="add-visitDate" className="mb-1.5 block text-sm font-medium text-slate-700">
                Visit Date <span className="text-red-500">*</span>
              </label>
              <input
                id="add-visitDate"
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div>
              <label htmlFor="add-timeSlot" className="mb-1.5 block text-sm font-medium text-slate-700">
                Time Slot <span className="text-red-500">*</span>
              </label>
              <input
                id="add-timeSlot"
                type="text"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                placeholder="e.g. 10:00 - 11:00 AM"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Outcome Section */}
      <div className="rounded-md bg-slate-50 p-3">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Outcome</p>
        <div className="space-y-3">
          <div>
            <label htmlFor="add-handledBy" className="mb-1.5 block text-sm font-medium text-slate-700">
              Handled By <span className="text-red-500">*</span>
            </label>
            <input
              id="add-handledBy"
              type="text"
              value={handledBy}
              onChange={(e) => setHandledBy(e.target.value)}
              placeholder="Enter employee name"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          <div>
            <label htmlFor="add-response" className="mb-1.5 block text-sm font-medium text-slate-700">
              Client Response <span className="text-red-500">*</span>
            </label>
            <select
              id="add-response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="">Select a response…</option>
              {RESPONSE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="add-status" className="mb-1.5 block text-sm font-medium text-slate-700">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              id="add-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="add-remark" className="mb-1.5 block text-sm font-medium text-slate-700">
              Remark
            </label>
            <textarea
              id="add-remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={3}
              placeholder="Add any notes about the visit…"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Upload Image (optional)
            </label>
            <label
              htmlFor="add-visitImage"
              className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500 transition hover:border-blue-400 hover:text-blue-500"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="h-32 w-full rounded-md object-cover" />
              ) : (
                <>
                  <svg className="mb-2 h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V19a1.5 1.5 0 001.5 1.5h15A1.5 1.5 0 0021 19v-2.5M16.5 8.25L12 3.75m0 0L7.5 8.25M12 3.75V15" />
                  </svg>
                  <span>Click to upload a photo</span>
                  <span className="mt-1 text-xs text-slate-400">PNG, JPG, WEBP up to 10MB</span>
                </>
              )}
            </label>
            <input
              id="add-visitImage"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="sr-only"
            />
            {imagePreview && (
              <button
                type="button"
                onClick={() => { setImageFile(null); setImagePreview(""); }}
                className="mt-1.5 text-xs text-red-500 hover:text-red-700"
              >
                Remove image
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uploading ? "Uploading image…" : submitting ? "Saving…" : "Save Visit"}
      </button>
    </form>
  );
}