import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"></div>

      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500"></div>
      </div>
    </>
  );
};

export default LoadingSpinner;
