export const analyzeLocalSentiment = (comment: string, videoTitle: string): string => {
  const commentLower = comment.toLowerCase();
  
  const agreeKeywords = [
    'agree', 'yes', 'right', 'correct', 'exactly', 'true', 'good point', 'well said',
    'love', 'great', 'awesome', 'amazing', 'excellent', 'perfect', 'best', 'fantastic',
    'helpful', 'informative', 'useful', 'insightful', 'brilliant', 'spot on', 'valid',
    'thanks', 'thank you', '👍', '❤️', '💯', 'appreciate', 'accurate'
  ];
  
  const disagreeKeywords = [
    'disagree', 'no', 'wrong', 'incorrect', 'false', 'bad', 'terrible', 'awful',
    'hate', 'dislike', 'worst', 'poor', 'useless', 'misleading', 'inaccurate',
    'disappointing', 'rubbish', 'nonsense', 'ridiculous', 'stupid', 'bs', 'lies',
    'thumbs down', '👎', 'waste', 'garbage', 'trash', 'horrible', 'not true'
  ];
  
  let agreeScore = 0;
  let disagreeScore = 0;
  
  agreeKeywords.forEach(keyword => {
    if (commentLower.includes(keyword)) {
      agreeScore += 1;
    }
  });
  
  disagreeKeywords.forEach(keyword => {
    if (commentLower.includes(keyword)) {
      disagreeScore += 1;
    }
  });
  
  const negationWords = ['not', 'don\'t', 'doesn\'t', 'didn\'t', 'isn\'t', 'aren\'t', 'wasn\'t', 'weren\'t', 'never'];
  
  negationWords.forEach(negation => {
    agreeKeywords.forEach(keyword => {
      const pattern = new RegExp(`${negation}\\s+\\w*\\s*${keyword}|${negation}\\s+${keyword}`);
      if (pattern.test(commentLower)) {
        agreeScore -= 1;
        disagreeScore += 1;
      }
    });
    
    disagreeKeywords.forEach(keyword => {
      const pattern = new RegExp(`${negation}\\s+\\w*\\s*${keyword}|${negation}\\s+${keyword}`);
      if (pattern.test(commentLower)) {
        disagreeScore -= 1;
        agreeScore += 1;
      }
    });
  });
  
  if (agreeScore > disagreeScore) {
    return "agree";
  } else if (disagreeScore > agreeScore) {
    return "disagree";
  } else {
    return "neutral";
  }
};