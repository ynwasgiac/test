// src/pages/categories/CategoryDetailPage.tsx
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeftIcon,
  BookOpenIcon,
  AcademicCapIcon,
  PlusIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ViewColumnsIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

import { categoriesAPI, wordsAPI, learningAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { Category, KazakhWordSummary } from '../../types/api';

import LoadingSpinner from '../../components/ui/LoadingSpinner';
import WordCard from '../../components/word/WordCard';

const CategoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const categoryId = parseInt(id || '0');

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedWords, setSelectedWords] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    difficulty_level_id: undefined as number | undefined,
    word_type_id: undefined as number | undefined,
  });

  // Fetch category details
  const { data: category, isLoading: categoryLoading, error: categoryError } = useQuery({
    queryKey: ['category', categoryId, user?.main_language?.language_code],
    queryFn: () => categoriesAPI.getCategory(categoryId, user?.main_language?.language_code),
    enabled: !!categoryId,
  });

  // Fetch words in this category
  const { data: words, isLoading: wordsLoading } = useQuery({
    queryKey: ['category-words', categoryId, user?.main_language?.language_code, searchTerm, filters],
    queryFn: () => {
      if (searchTerm.length > 2) {
        return wordsAPI.searchWords(searchTerm, user?.main_language?.language_code, 100);
      } else {
        return wordsAPI.getWordsByCategory(
          categoryId, 
          user?.main_language?.language_code,
          0,
          100
        );
      }
    },
    enabled: !!categoryId,
  });

  // Fetch user's learning progress
  const { data: learningProgress } = useQuery({
    queryKey: ['learning-progress'],
    queryFn: () => learningAPI.getProgress(),
  });

  // Mutations
  const addToLearningMutation = useMutation({
    mutationFn: (wordIds: number[]) => learningAPI.addWordToLearning(wordIds),
    onSuccess: () => {
      toast.success('Words added to learning list!');
      queryClient.invalidateQueries({ queryKey: ['learning-progress'] });
      setSelectedWords([]);
    },
    onError: () => toast.error('Failed to add words to learning list'),
  });

  const removeFromLearningMutation = useMutation({
    mutationFn: (wordIds: number[]) => learningAPI.removeWordFromLearning(wordIds),
    onSuccess: () => {
      toast.success('Words removed from learning list!');
      queryClient.invalidateQueries({ queryKey: ['learning-progress'] });
    },
    onError: () => toast.error('Failed to remove words from learning list'),
  });

  // Get learning word IDs for heart status
  const learningWordIds = new Set(
    learningProgress?.map(progress => progress.kazakh_word_id) || []
  );

  // Filter words based on search and filters
  const filteredWords = words?.filter(word => {
    if (searchTerm.length <= 2) return true;
    
    const matchesSearch = word.kazakh_word.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         word.kazakh_cyrillic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         word.primary_translation?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDifficulty = !filters.difficulty_level_id || word.difficulty_level === filters.difficulty_level_id;
    const matchesType = !filters.word_type_id || word.word_type_name.toLowerCase().includes('type'); // You'd need proper filtering here
    
    return matchesSearch && matchesDifficulty && matchesType;
  }) || [];

  // Event handlers
  const handleWordSelection = (wordId: number) => {
    setSelectedWords(prev => 
      prev.includes(wordId) 
        ? prev.filter(id => id !== wordId)
        : [...prev, wordId]
    );
  };

  const handleAddToLearning = (wordId: number) => {
    addToLearningMutation.mutate([wordId]);
  };

  const handleRemoveFromLearning = (wordId: number) => {
    removeFromLearningMutation.mutate([wordId]);
  };

  const handleBulkAddToLearning = () => {
    if (selectedWords.length > 0) {
      addToLearningMutation.mutate(selectedWords);
    }
  };

  const getCategoryIcon = (categoryName?: string) => {
    if (!categoryName) return '📚';
    
    const iconMap: Record<string, string> = {
      'food': '🍎',
      'animals': '🐾',
      'family': '👨‍👩‍👧‍👦',
      'colors': '🎨',
      'numbers': '🔢',
      'body': '👤',
      'nature': '🌱',
      'transport': '🚗',
      'clothing': '👕',
      'house': '🏠',
    };
    
    const key = categoryName.toLowerCase();
    return iconMap[key] || '📚';
  };

  // Loading and error states
  if (categoryLoading) {
    return <LoadingSpinner fullScreen text="Loading category..." />;
  }

  if (categoryError || !category) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Category not found</h2>
        <p className="text-gray-600 mb-6">
          The category you're looking for doesn't exist or has been removed.
        </p>
        <button
          onClick={() => navigate('/app/categories')}
          className="btn-primary"
        >
          Browse Categories
        </button>
      </div>
    );
  }

  const categoryName = category.translations?.[0]?.translated_name || category.category_name;
  const categoryDescription = category.translations?.[0]?.translated_description || category.description;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/app/categories')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span>Back to Categories</span>
        </button>

        {/* Bulk Actions */}
        {selectedWords.length > 0 && (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {selectedWords.length} selected
            </span>
            <button
              onClick={handleBulkAddToLearning}
              disabled={addToLearningMutation.isPending}
              className="btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add to Learning</span>
            </button>
          </div>
        )}
      </div>

      {/* Category Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8">
        <div className="flex items-center space-x-4 mb-4">
          <div className="text-6xl">
            {getCategoryIcon(category.category_name)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{categoryName}</h1>
            {categoryDescription && (
              <p className="text-lg text-gray-600 mt-2">{categoryDescription}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <BookOpenIcon className="h-5 w-5" />
            <span>{filteredWords.length} words</span>
          </div>
          <div className="flex items-center space-x-2">
            <HeartIcon className="h-5 w-5" />
            <span>
              {filteredWords.filter(word => learningWordIds.has(word.id)).length} in learning list
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Category ID: {category.id}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={`/app/practice?category=${categoryId}`}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
          >
            <AcademicCapIcon className="h-4 w-4" />
            <span>Practice This Category</span>
          </Link>
          <Link
            to={`/app/quiz?category=${categoryId}`}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
          >
            <span>Take Quiz</span>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search words in this category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${
                viewMode === 'grid' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <ViewColumnsIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${
                viewMode === 'list' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <ListBulletIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md border ${
              showFilters 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="h-5 w-5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={filters.difficulty_level_id || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    difficulty_level_id: e.target.value ? parseInt(e.target.value) : undefined
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Levels</option>
                  <option value="1">Level 1 - Beginner</option>
                  <option value="2">Level 2 - Elementary</option>
                  <option value="3">Level 3 - Intermediate</option>
                  <option value="4">Level 4 - Advanced</option>
                  <option value="5">Level 5 - Expert</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ difficulty_level_id: undefined, word_type_id: undefined })}
                  className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {wordsLoading && <LoadingSpinner text="Loading words..." />}

      {/* Words Display */}
      {!wordsLoading && filteredWords && (
        <div className="space-y-4">
          {/* Results Info */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {searchTerm ? `Found ${filteredWords.length} results` : `Showing ${filteredWords.length} words`}
            </p>
          </div>

          {/* Words Grid/List */}
          {filteredWords.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredWords.map((word) => (
                  <div key={word.id} className="relative">
                    {/* Selection Checkbox */}
                    <div className="absolute top-2 left-2 z-10">
                      <input
                        type="checkbox"
                        checked={selectedWords.includes(word.id)}
                        onChange={() => handleWordSelection(word.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    <WordCard
                      word={word}
                      isInLearningList={learningWordIds.has(word.id)}
                      onAddToLearning={handleAddToLearning}
                      onRemoveFromLearning={handleRemoveFromLearning}
                      showActions={true}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {filteredWords.map((word) => (
                  <div key={word.id} className="border-b border-gray-200 last:border-b-0">
                    <WordCard
                      word={word}
                      isInLearningList={learningWordIds.has(word.id)}
                      onAddToLearning={handleAddToLearning}
                      onRemoveFromLearning={handleRemoveFromLearning}
                      showActions={true}
                      compact={true}
                    />
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No words found' : 'No words in this category'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? `No words match your search "${searchTerm}" in this category.`
                  : 'This category doesn\'t have any words yet.'
                }
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="btn-primary"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryDetailPage;