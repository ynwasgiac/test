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