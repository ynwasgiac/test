// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, RequireAuth } from './contexts/AuthContext';

// Layout Components
import Layout from './components/layout/Layout';
import PublicLayout from './components/layout/PublicLayout';

// Public Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Protected Pages
import DashboardPage from './pages/DashboardPage';
import WordsPage from './pages/words/WordsPage';
import WordDetailPage from './pages/words/WordDetailPage';
import CategoriesPage from './pages/categories/CategoriesPage';
import CategoryDetailPage from './pages/categories/CategoryDetailPage';
import LearningPage from './pages/learning/LearningPage';
import PracticePage from './pages/learning/PracticePage';
import QuizPage from './pages/learning/QuizPage';
import ProgressPage from './pages/learning/ProgressPage';
import ProfilePage from './pages/profile/ProfilePage';
import SettingsPage from './pages/profile/SettingsPage';

// Error Pages
import NotFoundPage from './pages/error/NotFoundPage';

import './styles/globals.css';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<PublicLayout />}>
                <Route index element={<HomePage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
              </Route>

              {/* Protected Routes */}
              <Route
                path="/app"
                element={
                  <RequireAuth fallback={<Navigate to="/login" replace />}>
                    <Layout />
                  </RequireAuth>
                }
              >
                <Route index element={<Navigate to="/app/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                
                {/* Words Routes */}
                <Route path="words" element={<WordsPage />} />
                <Route path="words/:id" element={<WordDetailPage />} />
                
                {/* Categories Routes */}
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="categories/:id" element={<CategoryDetailPage />} />
                
                {/* Learning Routes */}
                <Route path="learn" element={<LearningPage />} />
                <Route path="practice" element={<PracticePage />} />
                <Route path="quiz" element={<QuizPage />} />
                <Route path="progress" element={<ProgressPage />} />
                
                {/* Profile Routes */}
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>

            {/* Toast Notifications */}
            <Toaster 
              position="top-right" 
              richColors 
              closeButton
              duration={4000}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;