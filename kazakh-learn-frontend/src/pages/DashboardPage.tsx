// src/pages/DashboardPage.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BookOpenIcon,
  AcademicCapIcon,
  TrophyIcon,
  FireIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { learningAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import StatsCard from '../components/ui/StatsCard';
import RecentActivity from '../components/dashboard/RecentActivity';
import LearningGoals from '../components/dashboard/LearningGoals';
import WordsToReview from '../components/dashboard/WordsToReview';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['learning-stats'],
    queryFn: learningAPI.getStats,
  });

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: learningAPI.getDashboard,
  });

  const isLoading = statsLoading || dashboardLoading;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const quickActions = [
    {
      name: 'Start Learning',
      description: 'Practice new words',
      href: '/app/learn',
      icon: AcademicCapIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Take Quiz',
      description: 'Test your knowledge',
      href: '/app/quiz',
      icon: TrophyIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Review Words',
      description: 'Practice saved words',
      href: '/app/practice',
      icon: ClockIcon,
      color: 'bg-orange-500',
    },
    {
      name: 'Browse Words',
      description: 'Explore vocabulary',
      href: '/app/words',
      icon: BookOpenIcon,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {getGreeting()}, {user?.full_name || user?.username}! 👋
            </h1>
            <p className="text-blue-100 mt-2">
              Ready to continue your Kazakh learning journey?
            </p>
            {user?.main_language && (
              <p className="text-blue-200 text-sm mt-1">
                Learning interface: {user.main_language.language_name}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <FireIcon className="h-6 w-6 text-orange-300" />
              <span className="text-xl font-bold">{stats?.current_streak || 0}</span>
            </div>
            <p className="text-blue-100 text-sm">day streak</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Words"
          value={stats?.total_words || 0}
          icon={BookOpenIcon}
          color="bg-blue-500"
        />
        <StatsCard
          title="Words Due Review"
          value={stats?.words_due_review || 0}
          icon={ClockIcon}
          color="bg-orange-500"
          link="/app/practice"
        />
        <StatsCard
          title="Accuracy Rate"
          value={`${stats?.accuracy_rate || 0}%`}
          icon={ChartBarIcon}
          color="bg-green-500"
        />
        <StatsCard
          title="Sessions This Week"
          value={stats?.sessions_this_week || 0}
          icon={AcademicCapIcon}
          color="bg-purple-500"
          link="/app/progress"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className="group block p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className={`${action.color} p-2 rounded-lg`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 group-hover:text-blue-600">
                    {action.name}
                  </h3>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Words to Review */}
        <div className="lg:col-span-2">
          <WordsToReview />
        </div>

        {/* Sidebar Content */}
        <div className="space-y-6">
          <LearningGoals />
          <RecentActivity />
        </div>
      </div>

      {/* Learning Progress Chart */}
      {stats && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Learning Progress
          </h3>
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
        </div>
      )}
    </div>
  );
};

export default DashboardPage;