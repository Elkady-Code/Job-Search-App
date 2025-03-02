import { Router } from "express";
import * as jobController from "./job.controller.js";
import * as validators from "./job.validation.js";
import { validation } from "../../middleware/validation.js";
import { authentication } from "../../middleware/auth.js";

const router = Router();

router.post(
  "/",
  authentication,
  validation(validators.createJobSchema),
  jobController.createJob
);

router.get(
  "/company/:companyId",
  authentication,
  validation(validators.getCompanyJobsSchema),
  jobController.getCompanyJobs
);

router.get(
  "/filter",
  authentication,
  validation(validators.getFilteredJobsSchema),
  jobController.getFilteredJobs
);

// Apply to Job
router.post(
  "/:id/apply",
  authentication,
  validation(validators.applyToJobSchema),
  jobController.applyToJob
);

// Get Job Applications
router.get(
  "/:id/applications",
  authentication,
  validation(validators.getJobApplicationsSchema),
  jobController.getJobApplications
);

// Update Application Status
router.patch(
  "/:jobId/application/:applicationId/status",
  authentication,
  validation(validators.updateApplicationStatusSchema),
  jobController.updateApplicationStatus
);

// Update Job - CompanyOwner only
router.put(
  "/:id",
  authentication,
  validation(validators.updateJobSchema),
  jobController.updateJob
);

// Delete Job - CompanyHR only
router.delete(
  "/:id",
  authentication,
  validation(validators.deleteJobSchema),
  jobController.deleteJob
);

export default router;
