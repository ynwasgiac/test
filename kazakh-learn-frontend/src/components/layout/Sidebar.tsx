// src/components/layout/Sidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  BookOpenIcon, 
  AcademicCapIcon,
  ChartBarIcon,
  UserIcon,
  Cog6ToothIcon,
  TagIcon,
  PuzzlePieceIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  current?: boolean;
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/app/dashboard', icon: HomeIcon },
    { name: 'Words', href: '/app/words', icon: BookOpenIcon },
    { name: 'Categories', href: '/app/categories', icon: TagIcon },
    { name: 'Learn', href: '/app/learn', icon: AcademicCapIcon },
    { name: 'Practice', href: '/app/practice', icon: PuzzlePieceIcon },
    { name: 'Quiz', href: '/app/quiz', icon: TrophyIcon },
    { name: 'Progress', href: '/app/progress', icon: ChartBarIcon },
    { name: 'Profile', href: '/app/profile', icon: UserIcon },
    { name: 'Settings', href: '/app/settings', icon: Cog6ToothIcon },
  ];

  const isCurrentPath = (href: string) => {
    if (href === '/app/dashboard') {
      return location.pathname === '/app' || location.pathname === '/app/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center">
        <Link to="/app/dashboard" className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">KL</span>
          </div>
          <span className="text-xl font-bold text-gray-900">Kazakh Learn</span>
        </Link>
      </div>

      {/* User info */}
      <div className="flex items-center space-x-3 py-3 px-3 bg-gray-50 rounded-lg">
        <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-sm">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user?.full_name || user?.username}
          </p>
          <p className="text-xs text-gray-500 capitalize">
            {user?.role}
          </p>
          {user?.main_language && (
            <p className="text-xs text-blue-600">
              Learning in {user.main_language.language_name}
            </p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const current = isCurrentPath(item.href);
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`
                        group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold
                        ${current
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <item.icon
                        className={`
                          h-6 w-6 shrink-0
                          ${current ? 'text-blue-700' : 'text-gray-400 group-hover:text-blue-700'}
                        `}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        </ul>
      </nav>

      {/* Footer */}
      <div className="mt-auto">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
          <div className="text-center">
            <h3 className="text-sm font-semibold text-gray-900">
              Keep Learning! 🚀
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              Practice daily to improve your Kazakh
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;