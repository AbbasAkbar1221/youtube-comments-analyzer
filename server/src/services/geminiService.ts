import dotenv from 'dotenv';
import { analyzeLocalSentiment } from './localSentimentService.js';
import { ApiBackoffManager } from './apiBackoffManager.js';

dotenv.config();

// Create a backoff manager for Gemini API
const geminiBackoff = new ApiBackoffManager('GeminiAPI', 5 * 60 * 1000, 2 * 60 * 60 * 1000);

// Cache for sentiment analysis results to avoid redundant API calls
const sentimentCache = new Map<string, string>();

/**
 * Analyzes sentiment of a comment using Gemini API with fallback to local analysis
 */
export const analyzeSentiment = async (comment: string, videoTitle: string): Promise<string> => {
  // Generate cache key
  const cacheKey = `${comment.slice(0, 100)}_${videoTitle.slice(0, 30)}`;
  
  // Check cache first
  if (sentimentCache.has(cacheKey)) {
    return sentimentCache.get(cacheKey)!;
  }
  
  // If API is in backoff mode, use local analysis
  if (!geminiBackoff.isAvailable()) {
    const result = analyzeLocalSentiment(comment, videoTitle);
    sentimentCache.set(cacheKey, result);
    return result;
  }
  
  // Try to use the Gemini API
  try {
    const result = await callGeminiApi(comment, videoTitle);
    sentimentCache.set(cacheKey, result);
    geminiBackoff.resetBackoff(); // Reset backoff on success
    return result;
  } catch (error: any) {
    // Handle API errors
    console.error('Error analyzing sentiment with Gemini:', error);
    
    // If it's a rate limit error, implement backoff
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
      geminiBackoff.triggerBackoff();
      console.log(`Gemini API quota exceeded. Switching to local sentiment analysis for ${geminiBackoff.getCurrentBackoff()/1000} seconds`);
    }
    
    // Use local sentiment analysis as fallback
    const result = analyzeLocalSentiment(comment, videoTitle);
    sentimentCache.set(cacheKey, result);
    return result;
  }
};

/**
 * Makes the actual API call to Gemini
 */
async function callGeminiApi(comment: string, videoTitle: string): Promise<string> {
  // Dynamic import to avoid errors if module is not available
  const { GoogleGenerativeAI } = await import('@google/generative-ai').catch(e => {
    console.error('Failed to import GoogleGenerativeAI:', e);
    throw new Error('GoogleGenerativeAI module could not be imported');
  });
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Analyze the sentiment of this YouTube comment for the video titled "${videoTitle}". 
  Categorize it as one of: "agree" (supports the content), "disagree" (opposes the content), 
  or "neutral" (neither clearly agrees nor disagrees). 
  Comment: "${comment}"
  
  Return ONLY one word: either "agree", "disagree", or "neutral".`;

  const result = await model.generateContent(prompt);
  const response = result.response.text().trim().toLowerCase();
  
  if (["agree", "disagree", "neutral"].includes(response)) {
    return response;
  }
  
  return "neutral"; // Default if response doesn't match expected values
}