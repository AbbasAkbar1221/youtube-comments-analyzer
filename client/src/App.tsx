// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import YouTubeAnalyzer from './components/YouTubeAnalyzer';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<YouTubeAnalyzer />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;