import { nanoid } from "nanoid";
import { OAuth2Client } from "google-auth-library";
import userModel from "../../DB/models/user.schema.js";
import { sendEmail } from "../../service/sendEmail.js";
import { eventEmitter } from "../../utils/sendEmailEvents/index.js";
import cloudinary from "../../utils/cloudinary/index.js";
import {
  compare,
  hash,
  encrypt,
  generateToken,
  verifyToken,
  OTPType,
  Provider,
  asyncHandler,
} from "../../utils/index.js";

const client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
});

// --------- Signup ---------
export const signup = asyncHandler(async (req, res, next) => {
  const isEmailExist = await userModel.findOne({
    email: req.body.email.toLowerCase(),
  });
  if (isEmailExist) {
    return next(new Error("Email already exists", { cause: 409 }));
  }

  const {
    firstName,
    lastName,
    email,
    password,
    gender,
    DOB,
    mobileNumber,
    role,
  } = req.body;

  if (!firstName || !lastName || !email || !password || !gender || !DOB) {
    return next(new Error("Missing required fields", { cause: 400 }));
  }

  const birthDate = new Date(DOB);
  if (isNaN(birthDate.getTime())) {
    return next(
      new Error("Invalid date format. Use YYYY-MM-DD", { cause: 400 })
    );
  }
  if (birthDate > new Date()) {
    return next(
      new Error("Date of birth cannot be in the future", { cause: 400 })
    );
  }

  const age = Math.floor(
    (Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
  );
  if (age < 18) {
    return next(
      new Error("User must be at least 18 years old", { cause: 400 })
    );
  }

  const OTP = nanoid(6);
  const hashedOTP = await hash(OTP);
  const OTPExpiryDate = new Date(Date.now() + 10 * 60 * 1000);

  const user = await userModel.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    password,
    gender,
    DOB: birthDate,
    mobileNumber: mobileNumber ? encrypt(mobileNumber) : undefined,
    role: role || "User",
    provider: Provider.SYSTEM,
    isConfirmed: false,
    OTP: [
      {
        code: hashedOTP,
        type: OTPType.CONFIRM_EMAIL,
        expiresIn: OTPExpiryDate,
      },
    ],
  });

  eventEmitter.emit("sendEmail", {
    email: user.email,
    subject: "Email Verification",
    html: `<h2>Email Verification</h2>
           <p>Your verification code is: <strong>${OTP}</strong></p>
           <p>This code will expire in 10 minutes.</p>`,
  });

  return res
    .status(201)
    .json({ message: "Please check your email for verification" });
});

// --------- Confirm OTP ---------
export const confirmOTP = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;
  const user = await userModel.findOne({ email: email.toLowerCase() });
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  const otpRecord = user.OTP.find(
    (item) =>
      item.type === OTPType.CONFIRM_EMAIL &&
      new Date(item.expiresIn) > new Date()
  );

  if (!otpRecord) {
    return next(new Error("OTP expired", { cause: 400 }));
  }

  const isValidOTP = await compare(otp, otpRecord.code);
  if (!isValidOTP) {
    return next(new Error("Invalid OTP", { cause: 400 }));
  }

  user.isConfirmed = true;
  user.OTP = user.OTP.filter((item) => item.type !== OTPType.CONFIRM_EMAIL);
  await user.save();

  return res.json({ message: "Email verified successfully" });
});

// --------- Signin ---------
export const signin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await userModel.findOne({
    email: email.toLowerCase(),
    provider: Provider.SYSTEM,
    isConfirmed: true,
  });

  if (!user) {
    return next(new Error("Invalid credentials", { cause: 401 }));
  }

  const isValidPassword = await compare(password, user.password);
  if (!isValidPassword) {
    return next(new Error("Invalid credentials", { cause: 401 }));
  }

  const tokens = {
    accessToken: await generateToken({
      payload: { id: user._id },
      SIGNATURE: process.env.SIGNATURE_TOKEN_USER,
      option: { expiresIn: "1h" },
    }),
    refreshToken: await generateToken({
      payload: { id: user._id },
      SIGNATURE: process.env.SIGNATURE_TOKEN_USER,
      option: { expiresIn: "7d" },
    }),
  };

  return res.json({ message: "Logged in successfully", tokens });
});

// -------- Google Auth ---------
export const authGoogle = asyncHandler(async (req, res, next) => {
  const { idToken, gender, DOB, role, email } = req.body;

  if (!idToken || !email) {
    return next(
      new Error("Google token and email are required", { cause: 400 })
    );
  }

  let ticket = await client.verifyIdToken({
    idToken,
    clockTolerance: 5,
  });

  const googleUserData = ticket.getPayload();
  const existingUser = await userModel.findOne({
    email: email.toLowerCase(),
  });

  if (existingUser) {
    if (existingUser.provider === Provider.SYSTEM) {
      existingUser.provider = Provider.GOOGLE;
      await existingUser.save();
    }

    const tokens = {
      accessToken: await generateToken({
        payload: { id: existingUser._id },
        SIGNATURE: process.env.SIGNATURE_TOKEN_USER,
        option: { expiresIn: "1h" },
      }),
      refreshToken: await generateToken({
        payload: { id: existingUser._id },
        SIGNATURE: process.env.SIGNATURE_TOKEN_USER,
        option: { expiresIn: "7d" },
      }),
    };
    return res.json({
      message: "Logged in successfully",
      tokens,
      isNewUser: false,
    });
  }

  if (!gender || !DOB) {
    return next(
      new Error("Gender and Date of Birth are required", { cause: 400 })
    );
  }

  const birthDate = new Date(DOB);
  if (isNaN(birthDate.getTime())) {
    return next(
      new Error("Invalid date format. Use YYYY-MM-DD", { cause: 400 })
    );
  }

  const age = Math.floor(
    (Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
  );
  if (age < 18) {
    return next(
      new Error("User must be at least 18 years old", { cause: 400 })
    );
  }

  const newUser = await userModel.create({
    firstName: googleUserData.given_name || "User",
    lastName: googleUserData.family_name || String(Date.now()),
    email: email.toLowerCase(),
    password: await hash(nanoid(10)),
    gender,
    DOB: birthDate,
    role: role || "User",
    provider: Provider.GOOGLE,
    isConfirmed: true,
    profilePic: googleUserData.picture
      ? {
          secure_url: googleUserData.picture,
          public_id: `google_user_${Date.now()}`,
        }
      : undefined,
  });

  const tokens = {
    accessToken: await generateToken({
      payload: { id: newUser._id },
      SIGNATURE: process.env.SIGNATURE_TOKEN_USER,
      option: { expiresIn: "1h" },
    }),
    refreshToken: await generateToken({
      payload: { id: newUser._id },
      SIGNATURE: process.env.SIGNATURE_TOKEN_USER,
      option: { expiresIn: "7d" },
    }),
  };

  return res.status(201).json({
    message: "Account created successfully",
    tokens,
    isNewUser: true,
  });
});

// -------- Send OTP ---------
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await userModel.findOne({
    email: email.toLowerCase(),
    provider: Provider.SYSTEM,
  });

  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  const OTP = nanoid(6);
  const hashedOTP = await hash(OTP);
  const OTPExpiryDate = new Date(Date.now() + 10 * 60 * 1000);

  user.OTP.push({
    code: hashedOTP,
    type: OTPType.FORGET_PASSWORD,
    expiresIn: OTPExpiryDate,
  });
  await user.save();

  await sendEmail({
    to: email,
    subject: "Reset Password Request",
    html: `<h2>Reset Password</h2>
           <p>Your reset code is: ${OTP}</p>
           <p>Expires in 10 minutes</p>`,
  });

  return res.json({ message: "Reset code sent to your email" });
});

// --------- Reset Password ---------
export const resetPassword = asyncHandler(async (req, res, next) => {
  const { email, otp, newPassword } = req.body;
  const user = await userModel.findOne({
    email: email.toLowerCase(),
    provider: Provider.SYSTEM,
  });

  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  const otpRecord = user.OTP.find(
    (item) =>
      item.type === OTPType.FORGET_PASSWORD &&
      new Date(item.expiresIn) > new Date()
  );

  if (!otpRecord) {
    return next(new Error("OTP expired", { cause: 400 }));
  }

  const isValidOTP = await compare(otp, otpRecord.code);
  if (!isValidOTP) {
    return next(new Error("Invalid OTP", { cause: 400 }));
  }

  user.password = newPassword;
  user.changeCredentialTime = new Date();
  user.OTP = user.OTP.filter((item) => item.type !== OTPType.FORGET_PASSWORD);
  await user.save();

  return res.json({ message: "Password reset successfully" });
});

// --------- Refresh Token ---------
export const refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  const decoded = await verifyToken({
    token: refreshToken,
    SIGNATURE: process.env.SIGNATURE_TOKEN_USER,
  });

  const decodedToken = decoded;
  const user = await userModel
    .findById(decodedToken.id)
    .select("changeCredentialTime isConfirmed bannedAt deletedAt");

  if (!user || user.deletedAt || user.bannedAt || !user.isConfirmed) {
    return next(new Error("Invalid or inactive account", { cause: 401 }));
  }

  if (
    user.changeCredentialTime &&
    new Date(user.changeCredentialTime) > new Date(decodedToken.iat * 1000)
  ) {
    return next(new Error("Token expired", { cause: 401 }));
  }

  const accessToken = await generateToken({
    payload: { id: user._id },
    SIGNATURE: process.env.SIGNATURE_TOKEN_USER,
    option: { expiresIn: "1h" },
  });

  return res.json({ accessToken });
});

// --------- Update User ---------
export const updateUser = asyncHandler(async (req, res, next) => {
  const { mobileNumber, DOB, firstName, lastName, gender } = req.body;
  const updates = {};

  if (firstName) updates.firstName = firstName;
  if (lastName) updates.lastName = lastName;
  if (gender) updates.gender = gender;
  if (mobileNumber) updates.mobileNumber = encrypt(mobileNumber);

  if (DOB) {
    const birthDate = new Date(DOB);
    if (isNaN(birthDate.getTime())) {
      return next(
        new Error("Invalid date format. Use YYYY-MM-DD", { cause: 400 })
      );
    }
    if (birthDate > new Date()) {
      return next(
        new Error("Date of birth cannot be in the future", { cause: 400 })
      );
    }
    const age = Math.floor(
      (Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
    );
    if (age < 18) {
      return next(
        new Error("User must be at least 18 years old", { cause: 400 })
      );
    }
    updates.DOB = birthDate;
  }

  const updatedUser = await userModel.findByIdAndUpdate(req.user._id, updates, {
    new: true,
  });

  return res.json({
    message: "Profile updated successfully",
    user: updatedUser,
  });
});

// --------- Get Profile ---------
export const getProfile = asyncHandler(async (req, res, next) => {
  const user = await userModel.findById(req.user._id);
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }
  return res.json({ user });
});

// --------- Get Other User Profile ---------
export const getOtherUserProfile = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const user = await userModel
    .findById(userId)
    .select("firstName lastName mobileNumber profilePic coverPic");

  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  return res.json({ user });
});
// --------- Update Password ---------
export const updatePassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const user = await userModel.findById(req.user._id);

  const isValidPassword = await compare(oldPassword, user.password);
  if (!isValidPassword) {
    return next(new Error("Invalid old password", { cause: 401 }));
  }

  user.password = newPassword;
  user.changeCredentialTime = new Date();
  await user.save();

  return res.json({ message: "Password updated successfully" });
});

// --------- Upload Profile Picture ---------
export const uploadProfilePic = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new Error("Please upload an image", { cause: 400 }));
  }

  const user = await userModel.findById(req.user._id);

  if (user.profilePic?.public_id) {
    await cloudinary.uploader.destroy(user.profilePic.public_id);
  }

  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: `jobsearch/users/${user._id}/profile`,
    }
  );

  user.profilePic = { secure_url, public_id };
  await user.save();

  return res.json({
    message: "Profile picture updated successfully",
    user: {
      profilePic: user.profilePic,
    },
  });
});

// --------- Upload Cover Picture ---------
export const uploadCoverPic = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new Error("Please upload an image", { cause: 400 }));
  }

  const user = await userModel.findById(req.user._id);

  if (user.coverPic?.public_id) {
    await cloudinary.uploader.destroy(user.coverPic.public_id);
  }

  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: `jobsearch/users/${user._id}/cover`,
    }
  );

  user.coverPic = { secure_url, public_id };
  await user.save();

  return res.json({
    message: "Cover picture updated successfully",
    user: {
      coverPic: user.coverPic,
    },
  });
});

// --------- Delete Profile Picture ---------
export const deleteProfilePic = asyncHandler(async (req, res, next) => {
  const user = await userModel.findById(req.user._id);

  if (!user.profilePic?.public_id) {
    return next(new Error("No profile picture to delete", { cause: 400 }));
  }

  await cloudinary.uploader.destroy(user.profilePic.public_id);
  user.profilePic = undefined;
  await user.save();

  return res.json({ message: "Profile picture deleted successfully" });
});

// --------- Delete Cover Picture ---------
export const deleteCoverPic = asyncHandler(async (req, res, next) => {
  const user = await userModel.findById(req.user._id);

  if (!user.coverPic?.public_id) {
    return next(new Error("No cover picture to delete", { cause: 400 }));
  }

  await cloudinary.uploader.destroy(user.coverPic.public_id);
  user.coverPic = undefined;
  await user.save();

  return res.json({ message: "Cover picture deleted successfully" });
});

// --------- Soft Delete Account ---------
export const deleteAccount = asyncHandler(async (req, res, next) => {
  const user = await userModel.findById(req.user._id);
  user.deletedAt = new Date();
  await user.save();

  return res.json({ message: "Account deleted successfully" });
});
