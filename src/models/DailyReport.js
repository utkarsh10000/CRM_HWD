import mongoose from "mongoose";

export const DAILY_REPORT_LOCATIONS = ["Dholera", "Delhi-Meerut-Expressway"];

const DailyReportSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      trim: true,
    },
    // Stored as "YYYY-MM-DD" in IST. This, combined with employeeId,
    // is what enforces "one report per employee per day".
    reportDate: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
      enum: DAILY_REPORT_LOCATIONS,
    },
    leadsAttended: {
      type: Number,
      required: true,
      min: 0,
    },
    notConnected: {
      type: Number,
      required: true,
      min: 0,
    },
    visitPlanned: {
      type: Number,
      required: true,
      min: 0,
    },
    visitManaged: {
      type: Number,
      required: true,
      min: 0,
    },
    // Meeting Done is split by who the meeting was with, plus a separate
    // count of business clocked.
    meetingDoneCp: {
      type: Number,
      required: true,
      min: 0,
    },
    meetingDoneClient: {
      type: Number,
      required: true,
      min: 0,
    },
    meetingDoneInvestor: {
      type: Number,
      required: true,
      min: 0,
    },
    businessClocked: {
      type: Number,
      required: true,
      min: 0,
    },
    bookingByCp: {
      type: Number,
      required: true,
      min: 0,
    },
    bookingBySelf: {
      type: Number,
      required: true,
      min: 0,
    },
    callConnected: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCalls: {
      type: Number,
      required: true,
      min: 0,
    },
    virtualMeeting: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

// One report per employee per day.
DailyReportSchema.index({ employeeId: 1, reportDate: 1 }, { unique: true });

// Force a fresh model definition so the new fields take effect immediately
// under Next.js hot reload in dev (same pattern used by Visit.js).
delete mongoose.models.DailyReport;

export default mongoose.model("DailyReport", DailyReportSchema, "dailyreports");