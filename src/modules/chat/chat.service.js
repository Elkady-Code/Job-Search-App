import { Router } from "express";
import * as chatController from "./chat.controller.js";
import * as validators from "./chat.validation.js";
import { validation } from "../../middleware/validation.js";
import { authentication } from "../../middleware/auth.js";

const router = Router();

router.get(
  "/:userId",
  authentication,
  validation(validators.getChatHistorySchema),
  chatController.getChatHistory
);

router.post(
  "/initialize/:userId",
  authentication,
  validation(validators.initializeChatSchema),
  chatController.initializeChat
);

export default router;
