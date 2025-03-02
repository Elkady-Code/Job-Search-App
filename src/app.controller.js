import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import connectionDB from "./DB/connectionDB.js";
import { globalErrorHandler, initIO } from "./utils/index.js";
import { otpCleaner } from "./service/otpCleaner.js";
import userRouter from "./modules/user/user.service.js";
import companyRouter from "./modules/company/company.service.js";
import adminRouter from "./modules/admin/admin.service.js";
import jobRouter from "./modules/jobs/job.service.js";
import chatRouter from "./modules/chat/chat.service.js";

const bootstrap = async (app, express, server) => {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later",
  });

  initIO(server);

  app.use(helmet());
  app.use(limiter);
  app.use(cors());
  app.use(express.json());

  await connectionDB();
  otpCleaner();

  app.get("/", (req, res) => {
    return res.status(200).json({ message: "Hello on Jobs Application" });
  });

  app.use("/users", userRouter);
  app.use("/companies", companyRouter);
  app.use("/job", jobRouter);
  app.use("/admin", adminRouter);
  app.use("/chat", chatRouter);

  app.all("*", (req, res, next) => {
    res.status(404).json({ message: `Invalid URL: ${req.originalUrl}` });
  });
  app.use(globalErrorHandler);
};

export default bootstrap;
