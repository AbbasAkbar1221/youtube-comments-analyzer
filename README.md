# YouTube Comments Analyzer

## 📌 Project Overview
The **YouTube Comments Analyzer** is a web application that analyzes comments from YouTube videos, providing insights such as sentiment distribution, keyword extraction, and comment statistics. It is built using the **MERN** stack and utilizes **Vite** for the frontend.

## 🚀 Features
- 📊 **Sentiment Analysis** (Positive, Negative, Neutral)
- 📌 **Top Keywords Extraction**
- 📆 **Monthly Comment Distribution**
- 📈 **Comment Statistics**
- 📤 **Export Analysis to CSV**
- 🎨 **Modern UI with Loading State**

## 🛠️ Tech Stack
- **Frontend**: React (Vite), TailwindCSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (with Mongoose)
- **External Libraries**: Axios, Chart.js, React Router

## 🔧 Installation & Setup
### 1️⃣ Clone the Repository
```sh
git clone https://github.com/your-username/youtube-comments-analyzer.git
cd youtube-comments-analyzer
```

### 2️⃣ Install Dependencies
```sh
npm install
```

### 3️⃣ Setup Environment Variables
Create a `.env` file in the root directory and add the following:
```env
VITE_API_URL=http://localhost:5000
```

### 4️⃣ Run the Application
```sh
npm run dev
```

## ⚡ API Endpoint
- **POST** `/api/analyze`
  - Request Body: `{ videoUrl: "https://youtube.com/watch?v=..." }`
  - Response: `{ sentimentDistribution, comments, keywords, monthlyDistribution }`

## 📜 License
This project is licensed under the **MIT License**.

## 📬 Contact
For any issues or contributions, feel free to open a PR or raise an issue! 🚀

