import mongoose from "mongoose";

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
    meetingDone: {
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
  },
  { timestamps: true }
);

// One report per employee per day.
DailyReportSchema.index({ employeeId: 1, reportDate: 1 }, { unique: true });

export default mongoose.models.DailyReport ||
  mongoose.model("DailyReport", DailyReportSchema, "dailyreports");