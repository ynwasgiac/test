// src/pages/learning/ProgressPage.tsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChartBarIcon, TrophyIcon, FireIcon, ClockIcon } from '@heroicons/react/24/outline';
import { learningAPI } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatsCard from '../../components/ui/StatsCard';

const ProgressPage: React.FC = () => {
  const location = useLocation();
  const sessionResults = location.state?.results;

  const { data: stats, isLoading } = useQuery({
    queryKey: ['learning-stats'],
    queryFn: learningAPI.getStats,
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading your progress..." />;
  }

  return (
    <div className="space-y-6">
      {/* Session Completion Banner */}
      {sessionResults && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <TrophyIcon className="h-8 w-8 text-green-600" />
            <h2 className="text-2xl font-bold text-green-900">Session Completed! 🎉</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{sessionResults.correct}</div>
              <div className="text-sm text-green-700">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{sessionResults.total - sessionResults.correct}</div>
              <div className="text-sm text-red-700">Incorrect</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{sessionResults.accuracy}%</div>
              <div className="text-sm text-blue-700">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{Math.floor(sessionResults.duration / 60)}m</div>
              <div className="text-sm text-purple-700">Duration</div>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-900">Your Learning Progress</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Words"
          value={stats?.total_words || 0}
          icon={ChartBarIcon}
          color="bg-blue-500"
        />
        <StatsCard
          title="Current Streak"
          value={stats?.current_streak || 0}
          icon={FireIcon}
          color="bg-orange-500"
        />
        <StatsCard
          title="Accuracy Rate"
          value={`${stats?.accuracy_rate || 0}%`}
          icon={TrophyIcon}
          color="bg-green-500"
        />
        <StatsCard
          title="Words Due Review"
          value={stats?.words_due_review || 0}
          icon={ClockIcon}
          color="bg-purple-500"
        />
      </div>

      {/* Detailed Progress */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Status Breakdown</h3>
        {stats?.words_by_status ? (
          <div className="space-y-4">
            {Object.entries(stats.words_by_status).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {status.replace('_', ' ')}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, (count / (stats.total_words || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No progress data available yet.</p>
        )}
      </div>
    </div>
  );
};

export default ProgressPage;