import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

export const fetchVideoComments = async (videoId: string) => {
  try {
    const response = await youtube.commentThreads.list({
      part: ['snippet'],
      videoId,
      maxResults: 100
    });

    return response.data.items?.map(item => ({
      commentId: item.id,
      text: item.snippet?.topLevelComment?.snippet?.textDisplay,
      username: item.snippet?.topLevelComment?.snippet?.authorDisplayName,
      publishedAt: item.snippet?.topLevelComment?.snippet?.publishedAt
    })) || [];
    
  } catch (error) {
    console.error('Error fetching YouTube comments:', error);
    throw error;
  }
};