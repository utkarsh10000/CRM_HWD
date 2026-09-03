import mongoose from "mongoose";

const FailedLeadEventSchema = new mongoose.Schema(
  {
    leadgenId: { type: String, required: true },
    pageId: { type: String, default: "" },
    formId: { type: String, default: "" },
    createdTime: { type: Number },
    error: { type: String, required: true },
    errorStatus: { type: Number },
    attempts: { type: Number, default: 1 },
    resolved: { type: Boolean, default: false },
    lastAttemptAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

FailedLeadEventSchema.index({ leadgenId: 1 }, { unique: true });

export default mongoose.models.FailedLeadEvent ||
  mongoose.model("FailedLeadEvent", FailedLeadEventSchema, "failed_lead_events");