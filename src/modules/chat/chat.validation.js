import Joi from "joi";
import { generalRules } from "../../utils/generalRules/index.js";

export const getChatHistorySchema = {
  params: Joi.object({
    userId: generalRules.id,
  }),
  headers: generalRules.headers,
};

export const initializeChatSchema = {
  params: Joi.object({
    userId: generalRules.id,
  }),
  body: Joi.object({
    message: Joi.string().required().min(1),
  }),
  headers: generalRules.headers,
};
