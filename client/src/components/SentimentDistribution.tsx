import React from 'react';

type SentimentDistributionProps = {
  data: {
    agree: number;
    disagree: number;
    neutral: number;
  };
};

const SentimentDistribution: React.FC<SentimentDistributionProps> = ({ data }) => {
  const total = data.agree + data.disagree + data.neutral;
  const agreePercent = total > 0 ? Math.round((data.agree / total) * 100) : 0;
  const disagreePercent = total > 0 ? Math.round((data.disagree / total) * 100) : 0;
  const neutralPercent = total > 0 ? Math.round((data.neutral / total) * 100) : 0;

  return (
    <div className="bg-gray-800 rounded-lg p-6 text-white">
      <h3 className="text-xl font-bold mb-4">Sentiment Distribution</h3>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span>Agree</span>
            <span>{agreePercent}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-green-500 h-2.5 rounded-full" 
              style={{ width: `${agreePercent}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <span>Disagree</span>
            <span>{disagreePercent}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-red-500 h-2.5 rounded-full" 
              style={{ width: `${disagreePercent}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <span>Neutral</span>
            <span>{neutralPercent}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-blue-500 h-2.5 rounded-full" 
              style={{ width: `${neutralPercent}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentimentDistribution;