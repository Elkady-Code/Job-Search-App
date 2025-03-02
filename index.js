import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve("config/.env") });

import express from "express";
import bootstrap from "./src/app.controller.js";

const app = express();
bootstrap(app, express);

export default (req, res) => {
  return app(req, res); 
};
