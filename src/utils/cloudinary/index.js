import { v2 as cloudinary } from "cloudinary";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), "config", ".env") });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log(
  "Cloudinary Configuration Status:",
  cloudinary.config().cloud_name ? "Configured" : "Not Configured"
);

export default cloudinary;
