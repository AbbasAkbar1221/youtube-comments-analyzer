import React from 'react';

type TopKeywordsProps = {
  keywords: string[];
};

const TopKeywords: React.FC<TopKeywordsProps> = ({ keywords }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 text-white">
      <h3 className="text-xl font-bold mb-4">Top Keywords</h3>
      
      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword, index) => (
          <span 
            key={index}
            className="px-3 py-1 bg-gray-700 rounded-full text-sm"
          >
            {keyword}
          </span>
        ))}
      </div>
    </div>
  );
};

export default TopKeywords;