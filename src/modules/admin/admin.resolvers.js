import userModel from "../../DB/models/user.schema.js";
import companyModel from "../../DB/models/company.schema.js";
import { UserRole } from "../../utils/index.js";

export const resolvers = {
  Query: {
    getDashboardData: async (_, __, { user }) => {
      if (user.role !== UserRole.ADMIN) {
        throw new Error("Unauthorized access");
      }

      const users = await userModel.find().select("-password");
      const companies = await companyModel.find().populate("companyHRs");

      return {
        users,
        companies,
      };
    },
  },

  Mutation: {
    banUser: async (_, { userId }, { user }) => {
      if (user.role !== UserRole.ADMIN) {
        throw new Error("Unauthorized access");
      }

      const targetUser = await userModel.findById(userId);
      if (!targetUser) {
        throw new Error("User not found");
      }

      targetUser.bannedAt = targetUser.bannedAt ? null : new Date();
      await targetUser.save();

      return targetUser;
    },

    banCompany: async (_, { companyId }, { user }) => {
      if (user.role !== UserRole.ADMIN) {
        throw new Error("Unauthorized access");
      }

      const company = await companyModel.findById(companyId);
      if (!company) {
        throw new Error("Company not found");
      }

      company.bannedAt = company.bannedAt ? null : new Date();
      await company.save();

      return company;
    },

    approveCompany: async (_, { companyId }, { user }) => {
      if (user.role !== UserRole.ADMIN) {
        throw new Error("Unauthorized access");
      }

      const company = await companyModel.findById(companyId);
      if (!company) {
        throw new Error("Company not found");
      }

      company.approved = true;
      company.approvedAt = new Date();
      await company.save();

      return company;
    },
  },
};
