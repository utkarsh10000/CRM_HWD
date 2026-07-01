import mongoose from "mongoose";

const VisitSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    contact: {
      type: String,
      required: true,
      trim: true,
    },
    project: {
      type: String,
      required: true,
      trim: true,
      enum: ["Expressway Residency", "Haute World City", "Haute-1st-Avenue"],
    },
    visitDate: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["planned", "visited", "interested", "not_interested", "follow_up", "revisit_requested", "closed"],
      default: "planned",
    },
    outcome: {
      handledBy: { type: String, trim: true, default: "" },
      response: {
        type: String,
        enum: [
          "",
          "interested",
          "not_interested",
          "confused",
          "time_taking",
          "asking_for_revisit",
          "asked_to_call_back",
          "negotiating_price",
          "already_has_provider",
          "decision_maker_unavailable",
          "follow_up_scheduled",
          "not_reachable",
          "will_think_and_revert",
        ],
        default: "",
      },
      remark: { type: String, trim: true, default: "" },
      imageUrl: { type: String, default: "" },
      imagePublicId: { type: String, default: "" },
      doneAt: { type: Date },
    },
  },
  { timestamps: true }
);

delete mongoose.models.Visit;
export default mongoose.model("Visit", VisitSchema, "visits");