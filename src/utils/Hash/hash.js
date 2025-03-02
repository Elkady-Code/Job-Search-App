import bcrypt from "bcryptjs";

export const hash = async (password) => {
  const saltRounds = parseInt(process.env.SALT_ROUNDS || "10");
  return await bcrypt.hash(password, saltRounds);
};
