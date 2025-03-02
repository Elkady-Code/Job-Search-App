import joi from "joi";
import { Types } from "mongoose";

const idValidation = (value, helper) => {
  const isValidId = Types.ObjectId.isValid(value);
  return isValidId ? value : helper.message(`Invalid id: ${value}`);
};

export const generalRules = {
  email: joi.string().email({ tlds: { allow: ["org", "outlook", "com"] } }),
  password: joi.string(),
  id: joi.string().custom(idValidation),
  headers: joi
    .object({
      "postman-token": joi.string().required(),
      "user-agent": joi.string().required(),
      "accept-encoding": joi.string().required(),
      accept: joi.string().required(),
      connection: joi.string().required(),
      host: joi.string().required(),
      authorization: joi.string(),
    })
    .unknown(true),
};
