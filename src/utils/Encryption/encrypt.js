import CryptoJS from "crypto-js";

export const encrypt = (data) => {
  if (!data) return null;
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error("Encryption key not found in environment variables");
  }
  return CryptoJS.AES.encrypt(
    data.toString(),
    process.env.ENCRYPTION_KEY
  ).toString();
};
