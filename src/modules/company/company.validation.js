import joi from "joi";
import { generalRules } from "../../utils/generalRules/index.js";

export const addCompanySchema = {
  body: joi.object({
    companyName: joi.string().min(2).max(100).required(),
    description: joi.string().min(10).required(),
    industry: joi.string().required(),
    address: joi.string().required(),
    numberOfEmployees: joi
      .string()
      .pattern(/^\d+-\d+\s+employee(s)?$/)
      .required(),
    companyEmail: generalRules.email.required(),
  }),
  headers: generalRules.headers,
};

export const updateCompanySchema = {
  body: joi.object({
    companyName: joi.string().min(2).max(100),
    description: joi.string().min(10),
    industry: joi.string(),
    address: joi.string(),
    numberOfEmployees: joi.string().pattern(/^\d+-\d+\s+employee(s)?$/),
    companyEmail: generalRules.email,
  }),
  params: joi.object({
    companyId: generalRules.id,
  }),
  headers: generalRules.headers,
};

export const companyIdSchema = {
  params: joi.object({
    companyId: generalRules.id,
  }),
  headers: generalRules.headers,
};

export const searchCompanySchema = {
  query: joi.object({
    name: joi.string().required(),
  }),
  headers: generalRules.headers,
};
