import mongoose from "mongoose";

const AssignmentHistorySchema = new mongoose.Schema(
  {
    fromEmployeeId: { type: String, default: null },
    toEmployeeId: { type: String, default: null },
    byEmployeeId: { type: String, required: true }, // "admin" for admin actions
    byRole: { type: String, required: true },
    reason: { type: String, default: "" },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const LeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    firstName: { type: String, trim: true, default: "" },
    lastName: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    source: {
      type: String,
      enum: ["meta", "ivr", "website", "manual", "other"],
      default: "manual",
    },
    status: {
      type: String,
      enum: ["new", "contacted", "qualified", "converted", "lost"],
      default: "new",
    },
    assignedTo: { type: String, default: null }, // Employee.employeeId
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    notes: [
      {
        text: { type: String, required: true },
        byEmployeeId: { type: String, required: true },
        at: { type: Date, default: Date.now },
      },
    ],
    meta: {
      leadgenId: { type: String, default: null },
      pageId: { type: String, default: "" },
      formId: { type: String, default: "" },
      formName: { type: String, default: "" },
      campaignId: { type: String, default: "" },
      campaignName: { type: String, default: "" },
      adsetId: { type: String, default: "" },
      adsetName: { type: String, default: "" },
      adId: { type: String, default: "" },
      adName: { type: String, default: "" },
      platform: { type: String, default: "" },
      submittedAt: { type: Date },
      customFields: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    ivr: {
      callId: { type: String, default: null },
      callerNumber: { type: String, default: "" },
      calledNumber: { type: String, default: "" },
      callStatus: { type: String, default: "" },
      durationSeconds: { type: Number, default: null },
      recordingUrl: { type: String, default: "" },
      receivedAt: { type: Date },
      raw: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    assignmentHistory: [AssignmentHistorySchema],
  },
  { timestamps: true }
);

// The "leadgen_id" from Meta is the idempotency key — this is what
// makes duplicate webhook deliveries a no-op instead of a duplicate lead.
LeadSchema.index({ "meta.leadgenId": 1 }, { unique: true, sparse: true });
LeadSchema.index({ "ivr.callId": 1 }, { unique: true, sparse: true });
LeadSchema.index({ "ivr.callId": 1 }, { unique: true, sparse: true });

export default mongoose.models.Lead || mongoose.model("Lead", LeadSchema, "leads");