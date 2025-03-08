import dotenv from 'dotenv';
import { analyzeLocalSentiment } from './localSentimentService.js';
import { ApiBackoffManager } from './apiBackoffManager.js';

dotenv.config();

const geminiBackoff = new ApiBackoffManager('GeminiAPI', 5 * 60 * 1000, 2 * 60 * 60 * 1000);

const sentimentCache = new Map<string, string>();

export const analyzeSentiment = async (comment: string, videoTitle: string): Promise<string> => {
  const cacheKey = `${comment.slice(0, 100)}_${videoTitle.slice(0, 30)}`;
  
  if (sentimentCache.has(cacheKey)) {
    return sentimentCache.get(cacheKey)!;
  }
  
  if (!geminiBackoff.isAvailable()) {
    const result = analyzeLocalSentiment(comment, videoTitle);
    sentimentCache.set(cacheKey, result);
    return result;
  }
  
  try {
    const result = await callGeminiApi(comment, videoTitle);
    sentimentCache.set(cacheKey, result);
    geminiBackoff.resetBackoff(); 
    return result;
  } catch (error: any) {
    console.error('Error analyzing sentiment with Gemini:', error);
    
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
      geminiBackoff.triggerBackoff();
      console.log(`Gemini API quota exceeded. Switching to local sentiment analysis for ${geminiBackoff.getCurrentBackoff()/1000} seconds`);
    }
    
    const result = analyzeLocalSentiment(comment, videoTitle);
    sentimentCache.set(cacheKey, result);
    return result;
  }
};

async function callGeminiApi(comment: string, videoTitle: string): Promise<string> {
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
  
  return "neutral"; 
}