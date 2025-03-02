import mongoose from "mongoose";
import { ApplicationStatus } from "../../utils/enums";

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userCV: {
      secure_url: String,
      public_id: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ApplicationStatus),
      default: ApplicationStatus.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

const applicationModel =
  mongoose.models.Application ||
  mongoose.model("Application", applicationSchema);
export default applicationModel;
