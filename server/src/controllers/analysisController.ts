import { Request, Response } from "express";
import { fetchVideoComments } from "../services/youtubeService.js";
import { analyzeSentiment } from "../services/geminiService.js";
import Comment from "../models/commentSchema.js";
import pLimit from "p-limit";

// Interface definitions remain the same
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

// Helper function to add delay (in ms)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Caching sentiment results to reduce duplicate API calls
const sentimentCache = new Map<string, string>();

async function getSentimentWithCache(comment: string, videoTitle: string): Promise<string> {
  const key = comment.trim().toLowerCase();
  if (sentimentCache.has(key)) {
    return sentimentCache.get(key)!;
  }
  const sentiment = await analyzeSentiment(comment, videoTitle);
  sentimentCache.set(key, sentiment);
  // Remove the cached result after 10 minutes
  setTimeout(() => sentimentCache.delete(key), 10 * 60 * 1000);
  return sentiment;
}

export const analyzeVideoComments = async (req: Request, res: Response) => {
  try {
    const { videoUrl, videoTitle = "YouTube Video" } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: "Video URL is required" });
    }

    // Extract video ID from URL
    const videoIdMatch = videoUrl.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    if (!videoIdMatch || !videoIdMatch[1]) {
      return res.status(400).json({ error: "Invalid YouTube video URL" });
    }
    const videoId = videoIdMatch[1];

    // Fetch comments from YouTube
    const comments: YouTubeComment[] = await fetchVideoComments(videoId);

    // Use p-limit to throttle concurrent sentiment analysis calls (limit to 2 concurrent requests)
    const limit = pLimit(2);

    // Process all comments with concurrency control
    const analyzedComments: AnalyzedComment[] = await Promise.all(
      comments.map((comment: YouTubeComment) =>
        limit(async () => {
          // Ensure comment text is defined
          const commentText = comment.text || "";

          // Add an extra delay (500ms) before each API call to help reduce rate limit hits
          await delay(500);

          // Use caching to avoid duplicate API calls
          const sentiment = await getSentimentWithCache(commentText, videoTitle);

          // Use a default username if missing
          const username =
            comment.username && comment.username.trim() ? comment.username : "Anonymous";
          const maskedUsername =
            username.length > 2
              ? `${username.substring(0, 2)}${"*".repeat(username.length - 2)}`
              : username;

          // Ensure commentId is a string
          const commentId =
            comment.commentId ||
            // `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            `comment_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

          // Safe handling of publishedAt
          const publishedAt = comment.publishedAt || new Date().toISOString();

          // Save to database
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

    // Generate analysis results (sentiment distribution)
    const sentimentDistribution = {
      agree: analyzedComments.filter((c) => c.sentiment === "agree").length,
      disagree: analyzedComments.filter((c) => c.sentiment === "disagree").length,
      neutral: analyzedComments.filter((c) => c.sentiment === "neutral").length,
    };

    // Calculate monthly distribution
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

    // Extract top keywords
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

// Helper function to extract keywords (unchanged)
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
