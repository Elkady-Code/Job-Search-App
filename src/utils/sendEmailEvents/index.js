import { EventEmitter } from "events";
import { sendEmail } from "../../service/sendEmail.js";

export const eventEmitter = new EventEmitter();

eventEmitter.on("sendEmail", async (data) => {
  const { email, subject, html } = data;

  try {
    await sendEmail({
      to: email,
      subject: subject,
      html: html,
    });
  } catch (error) {
    console.error("Failed to send email:", error);
  }
});
