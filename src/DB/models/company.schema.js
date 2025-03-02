import mongoose from "mongoose";
import jobModel from "./job.schema.js";
const companySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    industry: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    numberOfEmployees: {
      type: String,
      required: true,
      validate: {
        validator: function (count) {
          return /^\d+-\d+\s+employee(s)?$/.test(count);
        },
      },
    },
    companyEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    logo: {
      secure_url: String,
      public_id: String,
    },
    coverPic: {
      secure_url: String,
      public_id: String,
    },
    HRs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    bannedAt: Date,
    deletedAt: Date,
    legalAttachment: {
      secure_url: String,
      public_id: String,
    },
    approvedByAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

companySchema.virtual("jobs", {
  ref: "Job",
  localField: "_id",
  foreignField: "companyId",
});

const companyModel =
  mongoose.models.Company || mongoose.model("Company", companySchema);
export default companyModel;
