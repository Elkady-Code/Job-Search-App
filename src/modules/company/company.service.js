import { Router } from "express";
import * as companyController from "./company.controller.js";
import { validation } from "../../middleware/validation.js";
import * as validators from "./company.validation.js";
import { authentication } from "../../middleware/auth.js";
import { fileUpload } from "../../utils/index.js";

const router = Router();

router.post(
  "/",
  authentication,
  validation(validators.addCompanySchema),
  companyController.addCompany
);

router.get(
  "/search",
  validation(validators.searchCompanySchema),
  companyController.searchCompanies
);

router.put(
  "/:companyId",
  authentication,
  validation(validators.updateCompanySchema),
  companyController.updateCompany
);

router.delete(
  "/:companyId",
  authentication,
  validation(validators.companyIdSchema),
  companyController.deleteCompany
);

router.patch(
  "/:companyId/logo",
  authentication,
  validation(validators.companyIdSchema),
  fileUpload("image").single("image"),
  companyController.uploadLogo
);

router.patch(
  "/:companyId/cover",
  authentication,
  validation(validators.companyIdSchema),
  fileUpload("image").single("image"),
  companyController.uploadCoverPic
);

router.delete(
  "/:companyId/logo",
  authentication,
  validation(validators.companyIdSchema),
  companyController.deleteLogo
);

router.delete(
  "/:companyId/cover",
  authentication,
  validation(validators.companyIdSchema),
  companyController.deleteCoverPic
);

router.get(
  "/:companyId",
  validation(validators.companyIdSchema),
  companyController.getCompany
);

export default router;
