import React from 'react';

type CommentStatisticsProps = {
  data: {
    totalComments: number;
    sentimentDistribution: {
      agree: number;
      disagree: number;
      neutral: number;
    };
  };
};

const CommentStatistics: React.FC<CommentStatisticsProps> = ({ data }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 text-white">
      <h3 className="text-xl font-bold mb-4">Comment Statistics</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-700 p-4 rounded-lg">
          <p className="text-sm text-gray-400">Total Comments</p>
          <p className="text-2xl font-bold">{data.totalComments.toLocaleString()}</p>
        </div>
        
        <div className="bg-green-900 p-4 rounded-lg">
          <p className="text-sm text-green-300">Agree</p>
          <p className="text-2xl font-bold text-green-400">{data.sentimentDistribution.agree}</p>
        </div>
        
        <div className="bg-red-900 p-4 rounded-lg">
          <p className="text-sm text-red-300">Disagree</p>
          <p className="text-2xl font-bold text-red-400">{data.sentimentDistribution.disagree}</p>
        </div>
        
        <div className="bg-blue-900 p-4 rounded-lg">
          <p className="text-sm text-blue-300">Neutral</p>
          <p className="text-2xl font-bold text-blue-400">{data.sentimentDistribution.neutral}</p>
        </div>
      </div>
    </div>
  );
};

export default CommentStatistics;