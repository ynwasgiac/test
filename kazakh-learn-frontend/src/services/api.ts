// src/services/api.ts
import axios, { AxiosResponse, AxiosError } from 'axios';
import { toast } from 'sonner';
import type {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  KazakhWord,
  KazakhWordSummary,
  Category,
  WordType,
  DifficultyLevel,
  Language,
  UserWordProgress,
  LearningSession,
  LearningStats,
  PracticeSession,
  QuizQuestion,
  WordFilters,
  LearningFilters,
} from '../types/api';

// Base configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const TOKEN_KEY = 'kazakh_learn_token';

export const tokenService = {
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  removeToken: (): void => localStorage.removeItem(TOKEN_KEY),
};

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = tokenService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Check for token refresh header
    const newToken = response.headers['x-new-token'];
    if (newToken) {
      tokenService.setToken(newToken);
      toast.success('Session refreshed automatically');
    }
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      tokenService.removeToken();
      window.location.href = '/login';
      toast.error('Session expired. Please log in again.');
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  async register(userData: RegisterRequest): Promise<User> {
    const response = await api.post<User>('/auth/register', userData);
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    tokenService.removeToken();
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  async setMainLanguage(languageCode: string): Promise<void> {
    await api.post('/user/language', { language_code: languageCode });
  },

  async clearMainLanguage(): Promise<void> {
    await api.delete('/user/language');
  },
};

// Words API
export const wordsAPI = {
  async getWords(filters: WordFilters = {}): Promise<KazakhWordSummary[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get<KazakhWordSummary[]>(`/words/?${params}`);
    return response.data;
  },

  async getWord(id: number, languageCode?: string): Promise<KazakhWord> {
    const params = languageCode ? `?language_code=${languageCode}` : '';
    const response = await api.get<KazakhWord>(`/words/${id}${params}`);
    return response.data;
  },

  async searchWords(query: string, languageCode?: string, limit?: number): Promise<KazakhWordSummary[]> {
    const params = new URLSearchParams({ q: query });
    if (languageCode) params.append('language_code', languageCode);
    if (limit) params.append('limit', limit.toString());
    
    const response = await api.get<KazakhWordSummary[]>(`/words/search/?${params}`);
    return response.data;
  },

  async getRandomWords(
    count: number = 10,
    difficultyLevelId?: number,
    categoryId?: number,
    languageCode?: string
  ): Promise<any[]> {
    const params = new URLSearchParams({ count: count.toString() });
    if (difficultyLevelId) params.append('difficulty_level_id', difficultyLevelId.toString());
    if (categoryId) params.append('category_id', categoryId.toString());
    if (languageCode) params.append('language_code', languageCode);
    
    const response = await api.get<any[]>(`/words/random/?${params}`);
    return response.data;
  },

  async getWordsByCategory(
    categoryId: number,
    languageCode?: string,
    skip?: number,
    limit?: number
  ): Promise<KazakhWordSummary[]> {
    const params = new URLSearchParams();
    if (languageCode) params.append('language_code', languageCode);
    if (skip) params.append('skip', skip.toString());
    if (limit) params.append('limit', limit.toString());
    
    const response = await api.get<KazakhWordSummary[]>(`/categories/${categoryId}/words?${params}`);
    return response.data;
  },
};

// Categories API
export const categoriesAPI = {
  async getCategories(languageCode?: string, activeOnly: boolean = true): Promise<Category[]> {
    const params = new URLSearchParams();
    if (languageCode) params.append('language_code', languageCode);
    if (activeOnly) params.append('active_only', 'true');
    
    const response = await api.get<Category[]>(`/categories/?${params}`);
    return response.data;
  },

  async getCategory(id: number, languageCode?: string): Promise<Category> {
    const params = languageCode ? `?language_code=${languageCode}` : '';
    const response = await api.get<Category>(`/categories/${id}${params}`);
    return response.data;
  },
};

// Word Types API
export const wordTypesAPI = {
  async getWordTypes(languageCode?: string, activeOnly: boolean = true): Promise<WordType[]> {
    const params = new URLSearchParams();
    if (languageCode) params.append('language_code', languageCode);
    if (activeOnly) params.append('active_only', 'true');
    
    const response = await api.get<WordType[]>(`/word-types/?${params}`);
    return response.data;
  },
};

// Difficulty Levels API
export const difficultyAPI = {
  async getDifficultyLevels(languageCode?: string, activeOnly: boolean = true): Promise<DifficultyLevel[]> {
    const params = new URLSearchParams();
    if (languageCode) params.append('language_code', languageCode);
    if (activeOnly) params.append('active_only', 'true');
    
    const response = await api.get<DifficultyLevel[]>(`/difficulty-levels/?${params}`);
    return response.data;
  },
};

// Languages API
export const languagesAPI = {
  async getLanguages(activeOnly: boolean = true): Promise<Language[]> {
    const params = activeOnly ? '?active_only=true' : '';
    const response = await api.get<Language[]>(`/languages/${params}`);
    return response.data;
  },

  async getLanguage(code: string): Promise<Language> {
    const response = await api.get<Language>(`/languages/${code}`);
    return response.data;
  },
};

// Learning Progress API
export const learningAPI = {
  async getDashboard(): Promise<any> {
    const response = await api.get('/learning/dashboard');
    return response.data;
  },

  async getStats(): Promise<LearningStats> {
    const response = await api.get<LearningStats>('/learning/stats');
    return response.data;
  },

  async getProgress(filters: LearningFilters = {}): Promise<UserWordProgress[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get<UserWordProgress[]>(`/learning/progress?${params}`);
    return response.data;
  },

  async addWordToLearning(wordIds: number[], status?: string): Promise<void> {
    await api.post('/learning/words/add', {
      word_ids: wordIds,
      status: status || 'want_to_learn',
    });
  },

  async removeWordFromLearning(wordIds: number[]): Promise<void> {
    await api.post('/learning/words/remove', {
      word_ids: wordIds,
    });
  },

  async updateWordProgress(
    wordId: number,
    data: {
      status?: string;
      was_correct?: boolean;
      difficulty_rating?: string;
      user_notes?: string;
    }
  ): Promise<UserWordProgress> {
    const response = await api.put<UserWordProgress>(`/learning/progress/${wordId}`, data);
    return response.data;
  },

  async getWordsForReview(limit: number = 20): Promise<UserWordProgress[]> {
    const response = await api.get<UserWordProgress[]>(`/learning/review?limit=${limit}`);
    return response.data;
  },

  async getSessions(limit: number = 50, offset: number = 0): Promise<LearningSession[]> {
    const response = await api.get<LearningSession[]>(`/learning/sessions?limit=${limit}&offset=${offset}`);
    return response.data;
  },
};

// Practice API
export const practiceAPI = {
  async startPracticeSession(
    sessionType: string = 'practice',
    wordCount: number = 10,
    categoryId?: number,
    difficultyLevelId?: number,
    includeReview: boolean = true,
    languageCode: string = 'en'
  ): Promise<PracticeSession> {
    const response = await api.post<PracticeSession>('/learning/practice/start', {
      session_type: sessionType,
      word_count: wordCount,
      category_id: categoryId,
      difficulty_level_id: difficultyLevelId,
      include_review: includeReview,
      language_code: languageCode,
    });
    return response.data;
  },

  async submitPracticeAnswer(
    sessionId: number,
    wordId: number,
    wasCorrect: boolean,
    questionType: string,
    userAnswer?: string,
    correctAnswer?: string,
    responseTimeMs?: number
  ): Promise<void> {
    await api.post(`/learning/practice/${sessionId}/answer`, {
      word_id: wordId,
      was_correct: wasCorrect,
      question_type: questionType,
      user_answer: userAnswer,
      correct_answer: correctAnswer,
      response_time_ms: responseTimeMs,
    });
  },

  async finishPracticeSession(sessionId: number, durationSeconds?: number): Promise<any> {
    const response = await api.post(`/learning/practice/${sessionId}/finish`, {
      duration_seconds: durationSeconds,
    });
    return response.data;
  },
};

// Quiz API
export const quizAPI = {
  async startQuiz(
    categoryId?: number,
    difficultyLevelId?: number,
    questionCount: number = 10,
    languageCode: string = 'en'
  ): Promise<{ session_id: number; questions: QuizQuestion[] }> {
    const response = await api.post('/learning/quiz/start', {
      category_id: categoryId,
      difficulty_level_id: difficultyLevelId,
      question_count: questionCount,
      language_code: languageCode,
    });
    return response.data;
  },

  async submitQuiz(sessionId: number, answers: any[]): Promise<any> {
    const response = await api.post(`/learning/quiz/${sessionId}/submit`, {
      session_id: sessionId,
      answers,
    });
    return response.data;
  },
};

// Error handling helper
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    if (error.response?.status === 422 && error.response?.data?.detail) {
      // Handle validation errors
      if (Array.isArray(error.response.data.detail)) {
        return error.response.data.detail.map((err: any) => err.msg).join(', ');
      }
    }
    return error.message || 'Network error occurred';
  }
  return 'An unexpected error occurred';
};

export default api;