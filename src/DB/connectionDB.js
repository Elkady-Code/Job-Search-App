import mongoose from "mongoose";

const connectionDB = async () => {
  if (!process.env.URI_CONNECTION) {
    throw new Error(
      "MongoDB connection string is not defined in environment variables"
    );
  }

  await mongoose
    .connect(process.env.URI_CONNECTION)
    .then(() => {
      console.log("Connected to Mongo DB!");
    })
    .catch((err) => {
      console.error("Error connecting to DB", err);
    });
};

export default connectionDB;
