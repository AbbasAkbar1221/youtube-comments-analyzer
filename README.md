# YouTube Comments Analyzer

## 📌 Project Overview
This project is a **YouTube Comments Analyzer** built using the **MERN stack** with **React (Vite)** on the frontend and a **Node.js/Express** backend. The app extracts comments from a YouTube video, analyzes their sentiment, and provides keyword insights using the **YouTube Data API** and **Gemini AI API**.

## 🛠️ Tech Stack
- **Frontend**: React (Vite), TailwindCSS, TypeScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (with Mongoose)
- **External Libraries**: Axios, Chart.js, React Router
- **API's**: YouTube Data API v3, Gemini AI API

---

## 🚀 Features
✅ Fetch comments from YouTube videos using the **YouTube Data API**  
✅ Perform **sentiment analysis** on comments using **Gemini AI API**  
✅ Display **sentiment distribution** (Agree, Neutral, Disagree)  
✅ Show **keyword extraction** insights  
✅ Monthly comment distribution visualization  
✅ **Download** analyzed data as a CSV file  
✅ **Loading state** with a transparent background overlay  

---

## 🏗️ Setup & Installation

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/youtube-comments-analyzer.git
cd youtube-comments-analyzer
```

### 2️⃣ Install Dependencies
#### Backend:
```bash
cd backend
npm install
```

#### Frontend:
```bash
cd frontend
npm install
```

### 3️⃣ Set Up Environment Variables
Create a `.env` file in both **frontend** and **backend** directories.

#### **Backend (.env)**
```env
PORT=5000
MONGODB_URI = mongodb://localhost:27017/youtube_analyzer
YOUTUBE_API_KEY=your_youtube_api_key
GEMINI_API_KEY=your_gemini_api_key
```

#### **Frontend (.env)** (for Vite, prefix with `VITE_`)
```env
VITE_API_BASE_URL=http://localhost:5000
```

### 4️⃣ Run the Application
#### Start the Backend Server:
```bash
cd backend
npm start
```

#### Start the Frontend:
```bash
cd frontend
npm run dev
```

---

## 🔄 Logic & API Flow

### 1️⃣ Fetching YouTube Comments
- The **YouTube API** is used to get video comments.
- The backend makes a `GET` request to:
  ```bash
  https://www.googleapis.com/youtube/v3/commentThreads
  ```
  with the `videoId` and `part=snippet`.

### 2️⃣ Sentiment Analysis (Gemini API)
- Each comment is sent to **Google Gemini AI API** for sentiment analysis.
- API endpoint:
  ```bash
  https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateText?key=GEMINI_API_KEY
  ```
- The response categorizes comments as **Agree, Neutral, or Disagree**.

### 3️⃣ Data Processing & Visualization
- Extracted data is **processed** in the backend and sent to the frontend.
- The frontend visualizes **Sentiment Distribution, Keyword Insights, Monthly Trends**.

### 4️⃣ Exporting Data
- Users can download the analyzed data as a **CSV file**.

---

## 🎨 UI Components
- **Input Box**: Enter YouTube video URL
- **Analyze Button**: Fetch & analyze comments
- **Loading Spinner**: Transparent overlay during API call
- **Charts & Graphs**: Display sentiment analysis results
- **Export CSV Button**: Download processed data

---

## 📌 Future Enhancements
🔹 Add **user authentication** for saving analysis history  
🔹 Support **multiple languages** for sentiment analysis  
🔹 Improve **keyword extraction accuracy** using NLP models  

---

## 📞 Contact & Contributions
- Feel free to fork and contribute! 🚀



