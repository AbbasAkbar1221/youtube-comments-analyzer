// services/youtubeService.ts
import { google } from 'googleapis';
import { youtube_v3 } from 'googleapis';
import {GaxiosResponse} from 'gaxios';
import dotenv from 'dotenv';
import { ApiBackoffManager } from './apiBackoffManager.js';
import { analyzeSentiment } from './geminiService.js'; 

dotenv.config();

// Define types for improved type safety
interface YouTubeComment {
  commentId: string;
  text: string | undefined;
  username: string | undefined;
  publishedAt: string | undefined;
}

interface SentimentResult {
  commentId: string;
  sentiment: string;
}

// Create YouTube API client
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

// Create a backoff manager for YouTube API
const youtubeBackoff = new ApiBackoffManager('YouTubeAPI', 1 * 60 * 1000, 30 * 60 * 1000);

// Cache for video comments to avoid redundant API calls
const commentsCache = new Map<string, YouTubeComment[]>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes cache TTL

/**
 * Fetches comments for a YouTube video with caching and parallel processing
 */
export const fetchVideoComments = async (videoId: string): Promise<YouTubeComment[]> => {
  // Check cache first
  if (commentsCache.has(videoId)) {
    const cachedData = commentsCache.get(videoId);
    if (cachedData) return cachedData;
  }
  
  // Check if API is available or in backoff
  if (!youtubeBackoff.isAvailable()) {
    console.log(`YouTube API in backoff mode. Returning empty comments list.`);
    return [];
  }
  
  try {
    // Fetch comments with pagination for efficiency
    const allComments = await fetchAllCommentPages(videoId);
    
    // Process and map the comments
    const processedComments: YouTubeComment[] = allComments.map(item => ({
      commentId: item.id??'',
      text: item.snippet?.topLevelComment?.snippet?.textDisplay??'',
      username: item.snippet?.topLevelComment?.snippet?.authorDisplayName??'Anonymous',
      publishedAt: item.snippet?.topLevelComment?.snippet?.publishedAt??'Unknown'
    }));
    
    // Store in cache with timestamp
    commentsCache.set(videoId, processedComments);
    
    // Set cache cleanup after TTL
    setTimeout(() => {
      commentsCache.delete(videoId);
    }, CACHE_TTL);
    
    return processedComments;
  } catch (error: any) {
    console.error('Error fetching YouTube comments:', error);
    
    // If it's a quota error, implement backoff
    if (error.code === 403 || error.message?.includes('quota')) {
      youtubeBackoff.triggerBackoff();
      console.log(`YouTube API quota exceeded. Backing off for ${youtubeBackoff.getCurrentBackoff()/1000} seconds`);
    }
    
    throw error;
  }
};

/**
 * Fetches all comment pages for a video
 */
// Change function signature to return typed response
async function fetchAllCommentPages(videoId: string, maxResults = 100): Promise<youtube_v3.Schema$CommentThread[]> {
  let allComments: youtube_v3.Schema$CommentThread[] = [];
  let nextPageToken: string | undefined = undefined;

  do {
    // Explicitly define response type
    const response: GaxiosResponse<youtube_v3.Schema$CommentThreadListResponse> = await youtube.commentThreads.list({
      part: ['snippet'],
      videoId,
      maxResults: Math.min(maxResults, 100),
      pageToken: nextPageToken
    });

    // Extract the `data` property explicitly
    const data = response.data;

    if (data.items) {
      allComments = [...allComments, ...data.items];
    }

    nextPageToken = data.nextPageToken ?? undefined;
    maxResults -= 100;
  } while (nextPageToken && maxResults > 0);

  return allComments;
}
// Optional: Batch processing utility for analyzing multiple comments
export const batchAnalyzeSentiment = async (comments: YouTubeComment[], videoTitle: string): Promise<SentimentResult[]> => {
  // Process in smaller chunks to avoid overwhelming the API
  const CHUNK_SIZE = 5;
  const results: SentimentResult[] = [];
  
  for (let i = 0; i < comments.length; i += CHUNK_SIZE) {
    const chunk = comments.slice(i, i + CHUNK_SIZE);
    
    // Process chunk in parallel
    const chunkPromises = chunk.map(comment => 
      comment.text 
        ? analyzeSentiment(comment.text, videoTitle)
            .then((sentiment: string) => ({
              commentId: comment.commentId,
              sentiment
            }))
        : Promise.resolve({ commentId: comment.commentId, sentiment: 'neutral' })
    );
    
    // Wait for chunk to complete
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }
  
  return results;
};