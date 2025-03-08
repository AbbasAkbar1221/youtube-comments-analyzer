// src/components/MonthlyDistribution.tsx
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type MonthlyDistributionProps = {
  data: Record<string, number>;
};

const MonthlyDistribution: React.FC<MonthlyDistributionProps> = ({ data }) => {
  // Sort the data by date
  const sortedData = Object.entries(data)
    .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime());
  
  // Convert YYYY-MM format to Month names
  const months = sortedData.map(([date]) => {
    const [year, month] = date.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[parseInt(month) - 1];
  });
  
  const commentCounts = sortedData.map(([, count]) => count);

  const chartData = {
    labels: months,
    datasets: [
      {
        label: 'Number of Comments',
        data: commentCounts,
        backgroundColor: 'rgba(147, 51, 234, 0.8)',
        borderColor: 'rgba(147, 51, 234, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
    },
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 text-white">
      <h3 className="text-xl font-bold mb-4">Monthly Distribution</h3>
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default MonthlyDistribution;