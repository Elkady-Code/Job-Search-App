import userModel from "../DB/models/user.schema.js";
import { asyncHandler, verifyToken, UserRole } from "../utils/index.js";

export const authentication = asyncHandler(async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return next(new Error("Authorization header is required", { cause: 401 }));
  }
  const [prefix, token] = authorization.split(" ");
  if (!prefix || !token) {
    return next(new Error("Missing Authorization Header", { cause: 400 }));
  }
  let SIGNATURE = undefined;
  if (prefix === "Bearer") {
    SIGNATURE = process.env.SIGNATURE_TOKEN_USER;
  } else if (prefix === "Admin") {
    SIGNATURE = process.env.SIGNATURE_TOKEN_ADMIN;
  } else {
    return next(new Error("Invalid Authorization token", { cause: 401 }));
  }
  const decoded = await verifyToken({ token, SIGNATURE });
  if (!decoded?.id) {
    return next(new Error("Invalid token payload", { cause: 400 }));
  }
  const user = await userModel.findById(decoded.id).select("+companyId");
  if (!user) {
    return next(new Error("User not found", { cause: 401 }));
  }
  if (
    (user.role === UserRole.COMPANY_HR ||
      user.role === UserRole.COMPANY_OWNER) &&
    !user.companyId
  ) {
    return next(
      new Error("User is not associated with any company", { cause: 403 })
    );
  }
  console.log("Authenticated user:", {
    id: user._id,
    role: user.role,
    companyId: user.companyId,
  });

  req.user = user;
  next();
});

export const authorization = (accessRoles = []) => {
  return asyncHandler(async (req, res, next) => {
    console.log("Current user role:", req.user.role);
    console.log("Allowed roles:", accessRoles);

    const allowedRoles = accessRoles.map((role) => UserRole[role] || role);
    console.log("Mapped roles:", allowedRoles);

    if (!allowedRoles.includes(req?.user?.role)) {
      return next(new Error("Access Denied", { cause: 403 }));
    }
    next();
  });
};
