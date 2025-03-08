import { Request, Response } from "express";
import { fetchVideoComments } from "../services/youtubeService.js";
import { analyzeSentiment } from "../services/geminiService.js";
import Comment from "../models/commentSchema.js";
import pLimit from "p-limit";


interface CommentData {
  commentId: string;
  text: string;
  username: string;
  publishedAt: string;
}

interface AnalyzedComment {
  commentId: string;
  text: string;
  username: string;
  publishedAt: string;
  sentiment: string;
  maskedUsername: string;
}

interface YouTubeComment {
  commentId: string | null | undefined;
  text: string | null | undefined;
  username: string | null | undefined;
  publishedAt: string | null | undefined;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const sentimentCache = new Map<string, string>();

async function getSentimentWithCache(comment: string, videoTitle: string): Promise<string> {
  const key = comment.trim().toLowerCase();
  if (sentimentCache.has(key)) {
    return sentimentCache.get(key)!;
  }
  const sentiment = await analyzeSentiment(comment, videoTitle);
  sentimentCache.set(key, sentiment);
  setTimeout(() => sentimentCache.delete(key), 10 * 60 * 1000);
  return sentiment;
}

export const analyzeVideoComments = async (req: Request, res: Response) => {
  try {
    const { videoUrl, videoTitle = "YouTube Video" } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: "Video URL is required" });
    }

    const videoIdMatch = videoUrl.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    if (!videoIdMatch || !videoIdMatch[1]) {
      return res.status(400).json({ error: "Invalid YouTube video URL" });
    }
    const videoId = videoIdMatch[1];

    const comments: YouTubeComment[] = await fetchVideoComments(videoId);

    const limit = pLimit(2);

    const analyzedComments: AnalyzedComment[] = await Promise.all(
      comments.map((comment: YouTubeComment) =>
        limit(async () => {
          const commentText = comment.text || "";
          await delay(500);

          const sentiment = await getSentimentWithCache(commentText, videoTitle);

          const username =
            comment.username && comment.username.trim() ? comment.username : "Anonymous";
          const maskedUsername =
            username.length > 2
              ? `${username.substring(0, 2)}${"*".repeat(username.length - 2)}`
              : username;

          const commentId =
            comment.commentId ||
            `comment_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

          const publishedAt = comment.publishedAt || new Date().toISOString();

          const newComment = new Comment({
            videoId,
            commentId,
            text: commentText,
            maskedUsername,
            originalUsername: username,
            publishedAt,
            sentiment,
          });
          try {
            await newComment.save();
          } catch (err) {
            console.error("Error saving comment to database:", err);
          }

          return {
            commentId,
            text: commentText,
            username: maskedUsername,
            publishedAt,
            sentiment,
            maskedUsername,
          };
        })
      )
    );

    const sentimentDistribution = {
      agree: analyzedComments.filter((c) => c.sentiment === "agree").length,
      disagree: analyzedComments.filter((c) => c.sentiment === "disagree").length,
      neutral: analyzedComments.filter((c) => c.sentiment === "neutral").length,
    };

    const monthlyDistribution: Record<string, number> = {};
    analyzedComments.forEach((comment) => {
      let date: Date;
      try {
        date = new Date(comment.publishedAt);
        if (isNaN(date.getTime())) throw new Error("Invalid date");
      } catch (e) {
        date = new Date();
      }
      const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthlyDistribution[monthYear] = (monthlyDistribution[monthYear] || 0) + 1;
    });

    const keywords = extractKeywords(
      analyzedComments.map((c) => c.text).filter(Boolean)
    );

    return res.json({
      totalComments: analyzedComments.length,
      sentimentDistribution,
      monthlyDistribution,
      keywords,
      comments: analyzedComments,
    });
  } catch (error) {
    console.error("Error analyzing video comments:", error);
    return res.status(500).json({ error: "Failed to analyze video comments" });
  }
};

function extractKeywords(texts: string[]): string[] {
  const commonWords = [
    "the",
    "and",
    "a",
    "to",
    "of",
    "in",
    "is",
    "it",
    "you",
    "that",
    "was",
    "for",
    "on",
    "are",
    "with",
    "as",
    "this",
    "not",
    "but",
    "be",
  ];

  const words = texts
    .join(" ")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !commonWords.includes(word));

  const wordCounts: Record<string, number> = {};
  words.forEach((word) => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });

  return Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}
