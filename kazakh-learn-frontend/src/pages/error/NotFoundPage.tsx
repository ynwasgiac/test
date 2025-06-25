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