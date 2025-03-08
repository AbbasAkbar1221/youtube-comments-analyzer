import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
  videoId: { type: String, required: true, index: true },
  commentId: { type: String, required: true },
  text: { type: String, required: true },
  maskedUsername: { type: String, required: true },
  originalUsername: { type: String, required: true },
  publishedAt: { type: Date, required: true },
  sentiment: {
    type: String,
    enum: ["agree", "disagree", "neutral"],
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Comment", CommentSchema);
