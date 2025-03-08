// services/geminiService.ts
import dotenv from 'dotenv';
import { analyzeLocalSentiment } from './localSentimentService.js';

dotenv.config();

// Flag to track if Gemini API is available
let isGeminiAvailable = true;
// Time when we should try the API again (in milliseconds)
let retryAfter = 0;
// Backoff duration in milliseconds (starting with 5 minutes)
const INITIAL_BACKOFF = 5 * 60 * 1000;
let currentBackoff = INITIAL_BACKOFF;
// Maximum backoff (2 hours)
const MAX_BACKOFF = 2 * 60 * 60 * 1000;

export const analyzeSentiment = async (comment: string, videoTitle: string): Promise<string> => {
  const currentTime = Date.now();
  
  // If API is in backoff mode and it's not time to retry yet, use local analysis
  if (!isGeminiAvailable && currentTime < retryAfter) {
    return analyzeLocalSentiment(comment, videoTitle);
  }
  
  // If we're past the retry time, give the API another chance
  if (!isGeminiAvailable && currentTime >= retryAfter) {
    isGeminiAvailable = true;
    console.log('Attempting to use Gemini API again after backoff period');
  }
  
  // Try to use the Gemini API if it's available
  if (isGeminiAvailable) {
    try {
      // Dynamic import to avoid errors if module is not available
      const { GoogleGenerativeAI } = await import('@google/generative-ai').catch(e => {
        console.error('Failed to import GoogleGenerativeAI:', e);
        return { GoogleGenerativeAI: null };
      });
      
      // If import failed, fall back to local analysis
      if (!GoogleGenerativeAI) {
        throw new Error('GoogleGenerativeAI module could not be imported');
      }
      
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `Analyze the sentiment of this YouTube comment for the video titled "${videoTitle}". 
      Categorize it as one of: "agree" (supports the content), "disagree" (opposes the content), 
      or "neutral" (neither clearly agrees nor disagrees). 
      Comment: "${comment}"
      
      Return ONLY one word: either "agree", "disagree", or "neutral".`;

      const result = await model.generateContent(prompt);
      const response = result.response.text().trim().toLowerCase();
      
      // Reset backoff on successful API call
      currentBackoff = INITIAL_BACKOFF;
      
      if (["agree", "disagree", "neutral"].includes(response)) {
        return response;
      }
      
      return "neutral"; // Default if response doesn't match expected values
    } catch (error: any) {
      // Handle API errors
      console.error('Error analyzing sentiment with Gemini:', error);
      
      // If it's a rate limit error (429), implement exponential backoff
      if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
        console.log(`Gemini API quota exceeded. Switching to local sentiment analysis for ${currentBackoff/1000} seconds`);
        isGeminiAvailable = false;
        retryAfter = Date.now() + currentBackoff;
        
        // Implement exponential backoff with a maximum cap
        currentBackoff = Math.min(currentBackoff * 2, MAX_BACKOFF);
      }
      
      // Use local sentiment analysis as fallback
      return analyzeLocalSentiment(comment, videoTitle);
    }
  } else {
    // Use local sentiment analysis if API is not available
    return analyzeLocalSentiment(comment, videoTitle);
  }
};



// // geminiService.ts
// import { GoogleGenerativeAI } from "@google/generative-ai";

// // Initialize the Google Generative AI client
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// // Track API availability
// let apiIsRateLimited = false;
// let rateLimitResetTime = 0;
// const RATE_LIMIT_COOLDOWN = 5 * 60 * 1000; // 5 minutes cooldown when rate limited

// // Sentiment words lists for local analysis
// const positiveWords = [
//   "good", "great", "excellent", "amazing", "love", "like", "agree", "yes", 
//   "awesome", "fantastic", "helpful", "best", "perfect", "brilliant", "wonderful",
//   "useful", "enjoyed", "recommend", "impressed", "happy", "glad", "thanks",
//   "thank", "definitely", "easy", "clear", "favorite", "interesting", "fun",
//   "works", "nice", "beautiful", "incredible", "cool", "appreciate", "quality"
// ];

// const negativeWords = [
//   "bad", "terrible", "awful", "hate", "dislike", "disagree", "no", "poor", 
//   "horrible", "worst", "useless", "waste", "disappointing", "annoying", "frustrating",
//   "mistake", "difficult", "confusing", "problem", "issue", "unfortunately", "fail",
//   "failed", "boring", "didn't", "dont", "can't", "cannot", "hard", "wrong", "ugly",
//   "expensive", "broken", "stupid", "misleading", "unhappy", "unclear", "error"
// ];

// // Local fallback for sentiment analysis
// function localSentimentAnalysis(text: string): string {
//   // Skip analysis for empty text
//   if (!text || text.trim() === "") {
//     return "neutral";
//   }
  
//   // Add more words to existing lists
//   const additionalPositiveWords = [
//     "correct", "true", "accurate", "helpful", "insightful", "valuable",
//     "beneficial", "worthwhile", "enlightening", "informative", "educational",
//     "support", "agree", "absolutely", "exactly", "precisely", "spot-on",
//     "well-said", "well-explained", "factual", "valid", "reasonable"
//   ];
  
//   const additionalNegativeWords = [
//     "incorrect", "false", "inaccurate", "unhelpful", "pointless", "irrelevant",
//     "biased", "disagree", "wrong", "off", "invalid", "nonsense", "ridiculous",
//     "absurd", "nonsensical", "untrue", "fake", "lies", "propaganda", "misleading",
//     "actually no", "not true", "couldn't be more wrong", "complete nonsense"
//   ];
  
//   const allPositiveWords = [...positiveWords, ...additionalPositiveWords];
//   const allNegativeWords = [...negativeWords, ...additionalNegativeWords];
  
//   const lowerText = text.toLowerCase();
//   let positiveCount = 0;
//   let negativeCount = 0;
  
//   // Check for positive words
//   allPositiveWords.forEach(word => {
//     const regex = new RegExp(`\\b${word}\\b`, 'gi');
//     const matches = lowerText.match(regex);
//     if (matches) positiveCount += matches.length;
//   });
  
//   // Check for negative words
//   allNegativeWords.forEach(word => {
//     const regex = new RegExp(`\\b${word}\\b`, 'gi');
//     const matches = lowerText.match(regex);
//     if (matches) negativeCount += matches.length;
//   });
  
//   // Enhanced negation handling with window
//   const negationWords = ["not", "no", "never", "don't", "doesn't", "didn't", "isn't", "aren't", "wasn't", "weren't"];
  
//   // Find each negation word position
//   negationWords.forEach(negation => {
//     let startPos = 0;
//     while (true) {
//       const negPos = lowerText.indexOf(negation, startPos);
//       if (negPos === -1) break;
      
//       // Check a window of 4 words after negation
//       const afterText = lowerText.substring(negPos + negation.length);
//       const nextWords = afterText.split(/\s+/).slice(0, 4).join(" ");
      
//       // Check if positive words are negated
//       allPositiveWords.forEach(posWord => {
//         const regex = new RegExp(`\\b${posWord}\\b`, 'gi');
//         if (regex.test(nextWords)) {
//           positiveCount--;
//           negativeCount++;
//         }
//       });
      
//       // Check if negative words are negated
//       allNegativeWords.forEach(negWord => {
//         const regex = new RegExp(`\\b${negWord}\\b`, 'gi');
//         if (regex.test(nextWords)) {
//           negativeCount--;
//           positiveCount++;
//         }
//       });
      
//       startPos = negPos + 1;
//     }
//   });
  
//   // Add more contextual phrases
//   const strongPositivePhrases = [
//     "love it", "highly recommend", "very good", "really like", "great job",
//     "agree with you", "well put", "exactly right", "100% agree", "spot on",
//     "couldn't agree more", "perfectly said", "that's true", "you're right"
//   ];
  
//   const strongNegativePhrases = [
//     "waste of time", "don't buy", "stay away", "terrible experience", "completely useless",
//     "disagree completely", "not at all", "you're wrong", "that's false", "not true",
//     "disagree with that", "that's incorrect", "you've got it wrong", "makes no sense"
//   ];
  
//   strongPositivePhrases.forEach(phrase => {
//     if (lowerText.includes(phrase)) positiveCount += 3;
//   });
  
//   strongNegativePhrases.forEach(phrase => {
//     if (lowerText.includes(phrase)) negativeCount += 3;
//   });
  
//   // Content-specific phrase detection
//   // Comments that directly reference agreement/disagreement with content
//   if (lowerText.includes("i agree with this video") || 
//       lowerText.includes("the video is right") ||
//       lowerText.includes("makes good points")) {
//     positiveCount += 5;
//   }
  
//   if (lowerText.includes("i disagree with this video") || 
//       lowerText.includes("the video is wrong") ||
//       lowerText.includes("makes bad points")) {
//     negativeCount += 5;
//   }
  
//   // Make decision based on weighted counts with stronger thresholds for neutral
//   const difference = Math.abs(positiveCount - negativeCount);
  
//   if (positiveCount > negativeCount && difference > 1) return "agree";
//   if (negativeCount > positiveCount && difference > 1) return "disagree";
//   return "neutral";
// }

// // Improved sentiment analysis with better error handling
// export async function analyzeSentiment(text: string, videoTitle: string): Promise<string> {
//   // Skip API call for very short texts - use local analysis
//   if (!text || text.length < 15 || text.split(/\s+/).length < 4) {
//     return localSentimentAnalysis(text);
//   }
  
//   // If we're currently rate limited and within the cooldown period, skip API call
//   if (apiIsRateLimited && Date.now() < rateLimitResetTime) {
//     console.log('Gemini API quota exceeded. Using local sentiment analysis');
//     return localSentimentAnalysis(text);
//   }
  
//   try {
//     // Only attempt API call if we're not in a known rate-limited state
//     const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
//     // More detailed prompt with context
//     const prompt = `
//       Analyze the sentiment of this YouTube comment related to the video titled "${videoTitle}".
//       Comment: "${text}"
      
//       Determine if the comment is expressing AGREEMENT or DISAGREEMENT with the video content, 
//       or if it's NEUTRAL/UNRELATED to the content itself.
      
//       - If the comment agrees with the video's points or content: respond "agree"
//       - If the comment disagrees with or criticizes the video's points: respond "disagree"
//       - If the comment is neutral, unrelated, or just a general statement: respond "neutral"
      
//       Return only one word: agree, disagree, or neutral.
//     `;
    
//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const sentiment = response.text().trim().toLowerCase();
    
//     // Reset rate limit flag if we successfully got a response
//     apiIsRateLimited = false;
    
//     // Validate the response
//     if (['agree', 'disagree', 'neutral'].includes(sentiment)) {
//       // Randomize a small percentage to avoid uniform distributions
//       const randomizationFactor = 0.05; // 5% chance of randomization
//       if (Math.random() < randomizationFactor) {
//         const options = ['agree', 'disagree', 'neutral'].filter(s => s !== sentiment);
//         return options[Math.floor(Math.random() * options.length)];
//       }
//       return sentiment;
//     } else {
//       console.log('Invalid Gemini response, using local fallback:', sentiment);
//       return localSentimentAnalysis(text);
//     }
//   } catch (error: any) {
//     // If we get a rate limit error, set the flag and cooldown time
//     if (error.status === 429) {
//       console.log('Gemini API quota exceeded. Switching to local sentiment analysis for 300 seconds');
//       apiIsRateLimited = true;
//       rateLimitResetTime = Date.now() + RATE_LIMIT_COOLDOWN;
//     }
    
//     console.error('Error analyzing sentiment with Gemini, using local fallback:', error);
//     return localSentimentAnalysis(text);
//   }
// }