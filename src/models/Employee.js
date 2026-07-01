import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// Reuse the existing model if it's already been compiled (avoids
// "Cannot overwrite model" errors on hot reload), and pin the
// collection name explicitly to "employees".
export default mongoose.models.Employee ||
  mongoose.model("Employee", EmployeeSchema, "employees");