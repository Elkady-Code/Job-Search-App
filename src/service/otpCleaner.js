import cron from "node-cron";
import userModel from "../DB/models/user.schema.js";

export const otpCleaner = () => {
  cron.schedule("0 */6 * * *", async () => {
    try {
      const currentDate = new Date();
      await userModel.updateMany(
        { "OTP.expiresIn": { $lt: currentDate } },
        { $pull: { OTP: { expiresIn: { $lt: currentDate } } } }
      );
    } catch (error) {
      console.error("OTP cleanup job failed:", error);
    }
  });
};
