import { google } from 'googleapis';
import { youtube_v3 } from 'googleapis';
import {GaxiosResponse} from 'gaxios';
import dotenv from 'dotenv';
import { ApiBackoffManager } from './apiBackoffManager.js';
import { analyzeSentiment } from './geminiService.js'; 

dotenv.config();

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

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

const youtubeBackoff = new ApiBackoffManager('YouTubeAPI', 1 * 60 * 1000, 30 * 60 * 1000);

const commentsCache = new Map<string, YouTubeComment[]>();
const CACHE_TTL = 15 * 60 * 1000; 

export const fetchVideoComments = async (videoId: string): Promise<YouTubeComment[]> => {
  if (commentsCache.has(videoId)) {
    const cachedData = commentsCache.get(videoId);
    if (cachedData) return cachedData;
  }
  
  if (!youtubeBackoff.isAvailable()) {
    console.log(`YouTube API in backoff mode. Returning empty comments list.`);
    return [];
  }
  
  try {
    const allComments = await fetchAllCommentPages(videoId);
    const processedComments: YouTubeComment[] = allComments.map(item => ({
      commentId: item.id??'',
      text: item.snippet?.topLevelComment?.snippet?.textDisplay??'',
      username: item.snippet?.topLevelComment?.snippet?.authorDisplayName??'Anonymous',
      publishedAt: item.snippet?.topLevelComment?.snippet?.publishedAt??'Unknown'
    }));
    
    commentsCache.set(videoId, processedComments);
    setTimeout(() => {
      commentsCache.delete(videoId);
    }, CACHE_TTL);
    
    return processedComments;
  } catch (error: any) {
    console.error('Error fetching YouTube comments:', error);
    
    if (error.code === 403 || error.message?.includes('quota')) {
      youtubeBackoff.triggerBackoff();
      console.log(`YouTube API quota exceeded. Backing off for ${youtubeBackoff.getCurrentBackoff()/1000} seconds`);
    }
    
    throw error;
  }
};

async function fetchAllCommentPages(videoId: string, maxResults = 100): Promise<youtube_v3.Schema$CommentThread[]> {
  let allComments: youtube_v3.Schema$CommentThread[] = [];
  let nextPageToken: string | undefined = undefined;

  do {
    const response: GaxiosResponse<youtube_v3.Schema$CommentThreadListResponse> = await youtube.commentThreads.list({
      part: ['snippet'],
      videoId,
      maxResults: Math.min(maxResults, 100),
      pageToken: nextPageToken
    });
    const data = response.data;

    if (data.items) {
      allComments = [...allComments, ...data.items];
    }

    nextPageToken = data.nextPageToken ?? undefined;
    maxResults -= 100;
  } while (nextPageToken && maxResults > 0);

  return allComments;
}
export const batchAnalyzeSentiment = async (comments: YouTubeComment[], videoTitle: string): Promise<SentimentResult[]> => {
  const CHUNK_SIZE = 5;
  const results: SentimentResult[] = [];
  
  for (let i = 0; i < comments.length; i += CHUNK_SIZE) {
    const chunk = comments.slice(i, i + CHUNK_SIZE);
    
    const chunkPromises = chunk.map(comment => 
      comment.text 
        ? analyzeSentiment(comment.text, videoTitle)
            .then((sentiment: string) => ({
              commentId: comment.commentId,
              sentiment
            }))
        : Promise.resolve({ commentId: comment.commentId, sentiment: 'neutral' })
    );
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }
  
  return results;
};