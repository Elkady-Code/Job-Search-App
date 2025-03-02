import multer from "multer";
import { nanoid } from "nanoid";
import path from "path";
import fs from "fs";
import fileValidation from "./fileValidation.js";

export const fileUpload = (customValidationType) => {
  // Use /tmp/uploads instead of ./uploads for Vercel
  const destinationPath = path.resolve("/tmp/uploads");

  if (!fs.existsSync(destinationPath)) {
    fs.mkdirSync(destinationPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destinationPath);
    },
    filename: (req, file, cb) => {
      const uniqueFileName = nanoid() + "_" + file.originalname;
      cb(null, uniqueFileName);
    },
  });

  const fileFilter = (req, file, cb) => {
    const validations = fileValidation[customValidationType];

    if (!validations || !Array.isArray(validations)) {
      cb(new Error("Invalid file validation type"), false);
      return;
    }

    if (validations.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file format"), false);
    }
  };

  return multer({ storage, fileFilter });
};
