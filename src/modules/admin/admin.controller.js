import { asyncHandler } from "../../utils/index.js";
import userModel from "../../DB/models/user.schema.js";
import companyModel from "../../DB/models/company.schema.js";
import { UserRole } from "../../utils/enums/index.js";

// --------- Get Dashboard Data ---------
export const getDashboardData = asyncHandler(async (req, res, next) => {
  if (req.user.role !== UserRole.ADMIN) {
    return next(new Error("Unauthorized access", { cause: 403 }));
  }

  const users = await userModel.find().select("-password");
  const companies = await companyModel.find();

  res.json({ users, companies });
});

// --------- Ban/Unban User ---------
export const banUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  const user = await userModel.findById(userId);
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  user.bannedAt = user.bannedAt ? null : new Date();
  await user.save();

  res.json({
    message: user.bannedAt
      ? "User banned successfully"
      : "User unbanned successfully",
    user,
  });
});

// --------- Ban/Unban Company ---------
export const banCompany = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;

  const company = await companyModel.findById(companyId);
  if (!company) {
    return next(new Error("Company not found", { cause: 404 }));
  }

  company.bannedAt = company.bannedAt ? null : new Date();
  await company.save();

  res.json({
    message: company.bannedAt
      ? "Company banned successfully"
      : "Company unbanned successfully",
    company,
  });
});

// --------- Approve Company ---------
export const approveCompany = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;

  const company = await companyModel.findById(companyId);
  if (!company) {
    return next(new Error("Company not found", { cause: 404 }));
  }

  company.approved = true;
  company.approvedAt = new Date();
  await company.save();

  res.json({
    message: "Company approved successfully",
    company,
  });
});
