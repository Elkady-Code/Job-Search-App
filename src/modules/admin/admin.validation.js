import joi from "joi";
import { generalRules } from "../../utils/generalRules/index.js";

export const userActionSchema = {
  params: joi.object({
    userId: generalRules.id,
  }),
  headers: generalRules.headers,
};

export const companyActionSchema = {
  params: joi.object({
    companyId: generalRules.id,
  }),
  headers: generalRules.headers,
};
