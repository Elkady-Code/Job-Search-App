import CryptoJS from "crypto-js";

export const decrypt = (encryptedData) => {
  if (!encryptedData) return null;
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error("Encryption key not found in environment variables");
  }
  const bytes = CryptoJS.AES.decrypt(encryptedData, process.env.ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};
