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