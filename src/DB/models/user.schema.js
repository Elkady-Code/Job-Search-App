import mongoose from "mongoose";
import { hash, encrypt } from "../../utils/index.js";
import {
  UserRole,
  Gender,
  Provider,
  OTPType,
} from "../../utils/enums/index.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    provider: {
      type: String,
      enum: Object.values(Provider),
      default: Provider.SYSTEM,
    },
    gender: {
      type: String,
      enum: Object.values(Gender),
      required: true,
    },
    DOB: {
      type: Date,
      required: true,
      validate: {
        validator: function (date) {
          const age = Math.floor(
            (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365)
          );
          return age >= 18;
        },
        message: "User must be at least 18 years old",
      },
    },
    mobileNumber: String,
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    isConfirmed: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    bannedAt: Date,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    changeCredentialTime: Date,
    profilePic: {
      secure_url: String,
      public_id: String,
    },
    coverPic: {
      secure_url: String,
      public_id: String,
    },
    OTP: [
      {
        code: String,
        type: {
          type: String,
          enum: Object.values(OTPType),
        },
        expiresIn: Date,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.virtual("username").get(function () {
  return `${this.firstName} ${this.lastName}`;
});
// Add this pre-save hook
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await hash(this.password);
  }
  if (this.isModified("mobileNumber") && this.mobileNumber) {
    this.mobileNumber = encrypt(this.mobileNumber);
  }
  next();
});

const userModel = mongoose.models.User || mongoose.model("User", userSchema);
export default userModel;
