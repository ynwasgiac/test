// src/pages/learning/QuizPage.tsx
import React from 'react';
import { TrophyIcon } from '@heroicons/react/24/outline';

const QuizPage: React.FC = () => {
  return (
    <div className="text-center py-12">
      <TrophyIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz Feature</h1>
      <p className="text-gray-600 mb-6">
        Interactive quizzes are coming soon! Test your Kazakh knowledge with multiple choice questions,
        listening exercises, and more.
      </p>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
        <p className="text-sm text-yellow-800">
          🚧 This feature is under development. Check back soon!
        </p>
      </div>
    </div>
  );
};

export default QuizPage;

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

// src/pages/profile/ProfilePage.tsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserIcon, AcademicCapIcon, CalendarIcon } from '@heroicons/react/24/outline';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>

      {/* Profile Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-6 mb-6">
          <div className="h-20 w-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-2xl">
              {user.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user.full_name || user.username}</h2>
            <p className="text-gray-600">{user.email}</p>
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full mt-2 capitalize">
              {user.role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              Account Details
            </h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Username:</dt>
                <dd className="text-gray-900">{user.username}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Email:</dt>
                <dd className="text-gray-900">{user.email}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Account Type:</dt>
                <dd className="text-gray-900 capitalize">{user.role}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Status:</dt>
                <dd className="text-green-600">Active</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              <AcademicCapIcon className="h-5 w-5 mr-2" />
              Learning Preferences
            </h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Interface Language:</dt>
                <dd className="text-gray-900">
                  {user.main_language?.language_name || 'English (Default)'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Member Since:</dt>
                <dd className="text-gray-900">
                  {new Date(user.created_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">More Profile Features Coming Soon!</h3>
        <p className="text-blue-700">
          We're working on adding achievement badges, learning streaks, social features, and more to your profile.
        </p>
      </div>
    </div>
  );
};

export default ProfilePage;

// src/pages/profile/SettingsPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { languagesAPI } from '../../services/api';
import { Cog6ToothIcon, GlobeAltIcon, BellIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

const SettingsPage: React.FC = () => {
  const { user, setMainLanguage, clearMainLanguage } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState(user?.main_language?.language_code || 'en');

  const { data: languages } = useQuery({
    queryKey: ['languages'],
    queryFn: () => languagesAPI.getLanguages(),
  });

  const handleLanguageChange = async (languageCode: string) => {
    try {
      if (languageCode === 'clear') {
        await clearMainLanguage();
        setSelectedLanguage('en');
      } else {
        await setMainLanguage(languageCode);
        setSelectedLanguage(languageCode);
      }
    } catch (error) {
      toast.error('Failed to update language preference');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Language Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <GlobeAltIcon className="h-5 w-5 mr-2" />
          Language Preferences
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interface Language
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full md:w-64 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="en">English</option>
              <option value="ru">Русский (Russian)</option>
              <option value="kk">Қазақша (Kazakh)</option>
              {languages?.map((language) => (
                <option key={language.id} value={language.language_code}>
                  {language.language_name}
                </option>
              ))}
              <option value="clear">Clear preference</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              This will be used for the app interface and word translations.
            </p>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BellIcon className="h-5 w-5 mr-2" />
          Notifications
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Daily Reminders</h4>
              <p className="text-sm text-gray-500">Get reminded to practice daily</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              defaultChecked
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Review Reminders</h4>
              <p className="text-sm text-gray-500">Get notified when words need review</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              defaultChecked
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Achievement Notifications</h4>
              <p className="text-sm text-gray-500">Get notified about achievements and milestones</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              defaultChecked
            />
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mt-4">
          🚧 Notification features are coming soon!
        </p>
      </div>

      {/* Learning Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Cog6ToothIcon className="h-5 w-5 mr-2" />
          Learning Settings
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Learning Goal
            </label>
            <select className="w-full md:w-48 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="5">5 words per day</option>
              <option value="10" selected>10 words per day</option>
              <option value="15">15 words per day</option>
              <option value="20">20 words per day</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Practice Session Length
            </label>
            <select className="w-full md:w-48 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="10" selected>10 words</option>
              <option value="15">15 words</option>
              <option value="20">20 words</option>
              <option value="25">25 words</option>
            </select>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mt-4">
          🚧 Advanced learning settings are coming soon!
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;

// src/pages/error/NotFoundPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, BookOpenIcon } from '@heroicons/react/24/outline';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-9xl mb-4">404</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          Oops! The page you're looking for doesn't exist. 
          It might have been moved, deleted, or you entered the wrong URL.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/app/dashboard"
            className="btn-primary flex items-center space-x-2"
          >
            <HomeIcon className="h-5 w-5" />
            <span>Go to Dashboard</span>
          </Link>
          
          <Link
            to="/app/words"
            className="btn-secondary flex items-center space-x-2"
          >
            <BookOpenIcon className="h-5 w-5" />
            <span>Browse Words</span>
          </Link>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            Need help? Check out our{' '}
            <Link to="/app/learn" className="text-blue-600 hover:text-blue-700">
              learning guide
            </Link>{' '}
            or{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700">
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;