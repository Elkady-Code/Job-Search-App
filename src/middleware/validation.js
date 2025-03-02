import { asyncHandler } from "../utils/Error/index.js";

export const validation = (schema) => {
  return asyncHandler(async (req, res, next) => {
    const validationResult = [];
    for (const key of Object.keys(schema)) {
      const { error } = schema[key].validate(req[key], { abortEarly: false });
      if (error) {
        validationResult.push(...error.details.map((detail) => detail.message));
      }
    }
    if (validationResult.length > 0) {
      return next(new Error(validationResult.join(", "), { cause: 400 }));
    }
    next();
  });
};
