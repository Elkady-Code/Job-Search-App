import joi from "joi";
import { UserRole, generalRules } from "../../utils/index.js";

export const signupSchema = {
  body: joi.object({
    firstName: joi.string().min(2).max(20).required(),
    lastName: joi.string().min(2).max(20).required(),
    email: generalRules.email.required(),
    password: generalRules.password
      .pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
      .required(),
    gender: joi.string().valid("Male", "Female").required(),
    DOB: joi.date().max("now").required(),
    mobileNumber: joi
      .string()
      .pattern(/^[+]?\d{10,14}$/)
      .required(),
    role: joi
      .string()
      .valid(...Object.values(UserRole))
      .default(UserRole.USER),
  }),
  headers: generalRules.headers,
};

export const confirmOTPSchema = {
  body: joi.object({
    email: generalRules.email.required(),
    otp: joi.string().required(),
  }),
  headers: generalRules.headers,
};

export const signinSchema = {
  body: joi.object({
    email: generalRules.email.required(),
    password: generalRules.password.required(),
  }),
  headers: generalRules.headers,
};

export const googleAuthSchema = {
  body: joi.object({
    idToken: joi.string().required(),
    email: generalRules.email.required(),
    gender: joi.string().valid("Male", "Female").required(),
    DOB: joi.date().max("now").required(),
    role: joi
      .string()
      .valid(...Object.values(UserRole))
      .default(UserRole.USER),
  }),
  headers: generalRules.headers,
};

export const forgotPasswordSchema = {
  body: joi.object({
    email: generalRules.email.required(),
  }),
  headers: generalRules.headers,
};

export const resetPasswordSchema = {
  body: joi.object({
    email: generalRules.email.required(),
    otp: joi.string().required(),
    newPassword: generalRules.password
      .pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
      .required(),
  }),
  headers: generalRules.headers,
};

export const refreshTokenSchema = {
  body: joi.object({
    refreshToken: joi.string().required(),
  }),
  headers: generalRules.headers,
};

export const updateUserSchema = {
  body: joi.object({
    firstName: joi.string().min(2).max(20),
    lastName: joi.string().min(2).max(20),
    mobileNumber: joi.string().pattern(/^[+]?\d{10,14}$/),
    gender: joi.string().valid("Male", "Female"),
    DOB: joi.date().max("now"),
  }),
  headers: generalRules.headers,
};

export const getUserProfileSchema = {
  headers: generalRules.headers,
};

export const getOtherUserProfileSchema = {
  params: joi.object({
    userId: generalRules.id,
  }),
  headers: generalRules.headers,
};

export const updatePasswordSchema = {
  body: joi.object({
    oldPassword: generalRules.password.required(),
    newPassword: generalRules.password
      .pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
      .required(),
  }),
  headers: generalRules.headers,
};
