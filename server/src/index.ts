import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import analysisRoutes from "./routes/analysisRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const mongoUri: string = process.env.MONGODB_URI as string;

if (!mongoUri) {
  throw new Error("MONGODB_URI is not defined in the environment variables.");
}

app.use(cors());
app.use(express.json());

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/api", analysisRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
