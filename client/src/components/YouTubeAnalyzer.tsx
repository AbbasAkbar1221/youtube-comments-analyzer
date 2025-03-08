import React, { useState } from 'react';
import axios from 'axios';
import SentimentDistribution from './SentimentDistribution';
import CommentStatistics from './CommentStatistics';
import MonthlyDistribution from './MonthlyDistribution';
import TopKeywords from './TopKeywords';
import LoadingSpinner from './LoadingSpinner';


const YouTubeAnalyzer: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!videoUrl) {
      setError('Please enter a YouTube video URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:5000/api/analyze', { videoUrl });
      setAnalysisData(response.data);
    } catch (err) {
      console.error('Error analyzing video:', err);
      setError('Failed to analyze video. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!analysisData || !analysisData.comments) return;

    // Create CSV content
    const headers = ['Comment', 'Username', 'Date', 'Sentiment'];
    const csvRows = [
      headers.join(','),
      ...analysisData.comments.map((comment: any) => {
        return [
          `"${comment.text.replace(/"/g, '""')}"`,
          comment.username,
          new Date(comment.publishedAt).toLocaleDateString(),
          comment.sentiment
        ].join(',');
      })
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'youtube_comments_analysis.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto px-4 py-8">
        {loading && <LoadingSpinner />}
      <div className="bg-white rounded-lg p-6 shadow-md mb-8">
        <h1 className="text-2xl font-bold text-purple-700 mb-6">YouTube Comments Analyzer</h1>
        
        <div className="mb-4">
          <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-1">
            YouTube Video URL
          </label>
          <input
            type="text"
            id="videoUrl"
            placeholder="https://youtube.com/watch?v=..."
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
        </div>
        
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 flex items-center justify-center"
        >
          {loading ? 'Analyzing...' : 'Analyze Comments'}
          {!loading && <span className="ml-2">→</span>}
        </button>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
      </div>

      {analysisData && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Analysis Results</h2>
            <button
              onClick={handleExportCSV}
              className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SentimentDistribution data={analysisData.sentimentDistribution} />
            <CommentStatistics data={analysisData} />
            <MonthlyDistribution data={analysisData.monthlyDistribution} />
            <TopKeywords keywords={analysisData.keywords} />
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeAnalyzer;