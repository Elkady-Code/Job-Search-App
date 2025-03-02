import joi from "joi";
import { generalRules } from "../../utils/generalRules/index.js";
import {
  JobLocation,
  WorkingTime,
  SeniorityLevel,
  ApplicationStatus,
} from "../../utils/index.js";

export const createJobSchema = {
  body: joi.object({
    jobTitle: joi.string().required().trim(),
    jobDescription: joi.string().required(),
    jobLocation: joi
      .string()
      .valid(...Object.values(JobLocation))
      .required(),
    workingTime: joi
      .string()
      .valid(...Object.values(WorkingTime))
      .required(),
    seniorityLevel: joi
      .string()
      .valid(...Object.values(SeniorityLevel))
      .required(),
    technicalSkills: joi.array().items(joi.string()).min(1).required(),
    softSkills: joi.array().items(joi.string()).min(1).required(),
    salary: joi.object({
      min: joi.number().positive().required(),
      max: joi.number().positive().greater(joi.ref("min")).required(),
    }),
  }),
  headers: generalRules.headers,
};

export const updateJobSchema = {
  body: joi
    .object({
      jobTitle: joi.string().trim(),
      jobDescription: joi.string(),
      jobLocation: joi.string().valid(...Object.values(JobLocation)),
      workingTime: joi.string().valid(...Object.values(WorkingTime)),
      seniorityLevel: joi.string().valid(...Object.values(SeniorityLevel)),
      technicalSkills: joi.array().items(joi.string()).min(1),
      softSkills: joi.array().items(joi.string()).min(1),
      salary: joi.object({
        min: joi.number().positive(),
        max: joi.number().positive().greater(joi.ref("min")),
      }),
      closed: joi.boolean(),
    })
    .min(1),
  params: joi.object({
    id: generalRules.id,
  }),
  headers: generalRules.headers,
};

export const getCompanyJobsSchema = {
  params: joi.object({
    companyId: joi
      .string()
      .required()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .message("Invalid company ID format"),
  }),
  query: joi.object({
    page: joi.number().min(1).optional(),
    limit: joi.number().min(1).optional(),
    search: joi.string().optional(),
  }),
};

export const applyToJobSchema = {
  body: joi.object({
    userCV: joi
      .object({
        secure_url: joi.string().uri().required(),
        public_id: joi.string().required(),
      })
      .required(),
    coverLetter: joi.string().min(10).required(),
  }),
  params: joi.object({
    id: generalRules.id,
  }),
  headers: generalRules.headers,
};

export const getJobApplicationsSchema = {
  params: joi.object({
    id: generalRules.id,
  }),
  query: joi.object({
    page: joi.number().integer().min(1),
    limit: joi.number().integer().min(1),
    sort: joi.string(),
  }),
  headers: generalRules.headers,
};

export const updateApplicationStatusSchema = {
  body: joi
    .object({
      status: joi
        .string()
        .valid("Pending", "Reviewing", "Shortlisted", "Accepted", "Rejected")
        .required(),
    })
    .required(),
  params: joi
    .object({
      jobId: generalRules.id,
      applicationId: generalRules.id,
    })
    .required(),
  headers: generalRules.headers,
};

export const deleteJobSchema = {
  params: joi.object({
    id: generalRules.id,
  }),
  headers: generalRules.headers,
};

export const getFilteredJobsSchema = {
  query: joi
    .object({
      workingTime: joi.string().valid("FULL_TIME", "PART_TIME", "REMOTE"),
      jobLocation: joi.string().valid("ONSITE", "REMOTE", "HYBRID"),
      seniorityLevel: joi
        .string()
        .valid("JUNIOR", "MID_LEVEL", "SENIOR", "TEAM_LEAD", "CTO"),
      jobTitle: joi.string(),
      technicalSkills: joi.string(),
      page: joi.number().min(1),
      limit: joi.number().min(1),
      sort: joi.string(),
      search: joi.string(),
    })
    .optional(),
};
