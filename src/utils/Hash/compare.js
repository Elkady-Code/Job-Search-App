import bcrypt from "bcryptjs";

export const compare = async (plainText, hashedText) => {
  return await bcrypt.compareSync(plainText, hashedText);
};
