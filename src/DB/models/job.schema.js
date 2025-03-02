import mongoose from "mongoose";
import { JobLocation, WorkingTime, SeniorityLevel } from "../../utils/index.js";

const jobSchema = new mongoose.Schema(
  {
    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },
    jobLocation: {
      type: String,
      enum: Object.values(JobLocation),
      required: true,
    },
    workingTime: {
      type: String,
      enum: Object.values(WorkingTime),
      required: true,
    },
    seniorityLevel: {
      type: String,
      enum: Object.values(SeniorityLevel),
      required: true,
    },
    jobDescription: {
      type: String,
      required: true,
    },
    technicalSkills: [
      {
        type: String,
        required: true,
      },
    ],
    softSkills: [
      {
        type: String,
        required: true,
      },
    ],
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    closed: {
      type: Boolean,
      default: false,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    applications: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        userCV: {
          secure_url: String,
          public_id: String,
        },
        status: {
          type: String,
          enum: [
            "pending",
            "accepted",
            "viewed",
            "in consideration",
            "rejected",
          ],
          default: "pending",
        },
        appliedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

jobSchema.virtual("companyDetails", {
  ref: "Company",
  localField: "companyId",
  foreignField: "_id",
  justOne: true,
});

jobSchema.set("toJSON", { virtuals: true });
jobSchema.set("toObject", { virtuals: true });

export default mongoose.model("Job", jobSchema);
