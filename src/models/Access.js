import mongoose from "mongoose";

const AccessSchema = new mongoose.Schema(
  {
    granteeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
    scopes: [
      { type: String, enum: ["dailyReports", "visitsPlanned", "visitsDone"] },
    ],
    grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  },
  { timestamps: true }
);

// One grant row per (senior, team) pair — scopes get overwritten on re-save.
AccessSchema.index({ granteeId: 1, teamId: 1 }, { unique: true });

export default mongoose.models.Access || mongoose.model("Access", AccessSchema, "access");