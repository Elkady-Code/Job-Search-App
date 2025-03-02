import { Router } from "express";
import * as adminController from "./admin.controller.js";
import * as validators from "./admin.validation.js";
import { validation } from "../../middleware/validation.js";
import { authentication } from "../../middleware/auth.js";

const router = Router();

router.get("/dashboard", authentication, adminController.getDashboardData);

router.patch(
  "/users/:userId/ban",
  authentication,
  validation(validators.userActionSchema),
  adminController.banUser
);

router.patch(
  "/companies/:companyId/ban",
  authentication,
  validation(validators.companyActionSchema),
  adminController.banCompany
);

router.patch(
  "/companies/:companyId/approve",
  authentication,
  validation(validators.companyActionSchema),
  adminController.approveCompany
);

export default router;
