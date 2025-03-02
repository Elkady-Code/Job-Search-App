import { Router } from "express";
import * as userController from "./user.controller.js";
import * as validators from "./user.validation.js";
import { validation } from "../../middleware/validation.js";
import { authentication } from "../../middleware/auth.js";
import { fileUpload } from "../../utils/index.js";

const router = Router();

router.post(
  "/signup",
  validation(validators.signupSchema),
  userController.signup
);
router.post(
  "/confirm-otp",
  validation(validators.confirmOTPSchema),
  userController.confirmOTP
);
router.post(
  "/signin",
  validation(validators.signinSchema),
  userController.signin
);
router.post(
  "/auth/google",
  validation(validators.googleAuthSchema),
  userController.authGoogle
);
router.post(
  "/forgot-password",
  validation(validators.forgotPasswordSchema),
  userController.forgotPassword
);
router.post(
  "/reset-password",
  validation(validators.resetPasswordSchema),
  userController.resetPassword
);
router.post(
  "/refresh-token",
  validation(validators.refreshTokenSchema),
  userController.refreshToken
);
router.put(
  "/",
  authentication,
  validation(validators.updateUserSchema),
  userController.updateUser
);
router.get("/profile", authentication, userController.getProfile);
router.get(
  "/profile/:userId",
  authentication,
  validation(validators.getOtherUserProfileSchema),
  userController.getOtherUserProfile
);
router.patch(
  "/password",
  authentication,
  validation(validators.updatePasswordSchema),
  userController.updatePassword
);
router.patch(
  "/profile-pic",
  authentication,
  fileUpload("image").single("image"),
  userController.uploadProfilePic
);
router.patch(
  "/cover-pic",
  authentication,
  fileUpload("image").single("image"),
  userController.uploadCoverPic
);
router.delete("/profile-pic", authentication, userController.deleteProfilePic);
router.delete("/cover-pic", authentication, userController.deleteCoverPic);
router.delete("/", authentication, userController.deleteAccount);

export default router;
