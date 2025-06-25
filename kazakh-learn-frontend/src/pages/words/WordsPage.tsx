// src/pages/words/WordsPage.tsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ViewColumnsIcon,
  ListBulletIcon,
  PlusIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

import { wordsAPI, categoriesAPI, wordTypesAPI, difficultyAPI, learningAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { WordFilters, KazakhWordSummary, Category, WordType, DifficultyLevel } from '../../types/api';

import LoadingSpinner from '../../components/ui/LoadingSpinner';
import WordCard from '../../components/word/WordCard';

const WordsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State for filters and view
  const [filters, setFilters] = useState<WordFilters>({
    skip: 0,
    limit: 20,
    language_code: user?.main_language?.language_code || 'en'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedWords, setSelectedWords] = useState<number[]>([]);

  // Fetch data
  const { data: words, isLoading: wordsLoading, error: wordsError } = useQuery({
    queryKey: ['words', filters],
    queryFn: () => wordsAPI.getWords(filters),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories', filters.language_code],
    queryFn: () => categoriesAPI.getCategories(filters.language_code),
  });

  const { data: wordTypes } = useQuery({
    queryKey: ['word-types', filters.language_code],
    queryFn: () => wordTypesAPI.getWordTypes(filters.language_code),
  });

  const { data: difficultyLevels } = useQuery({
    queryKey: ['difficulty-levels', filters.language_code],
    queryFn: () => difficultyAPI.getDifficultyLevels(filters.language_code),
  });

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
    onError: (error) => {
      toast.error('Failed to add words to learning list');
      console.error('Add to learning error:', error);
    },
  });

  const removeFromLearningMutation = useMutation({
    mutationFn: (wordIds: number[]) => learningAPI.removeWordFromLearning(wordIds),
    onSuccess: () => {
      toast.success('Words removed from learning list!');
      queryClient.invalidateQueries({ queryKey: ['learning-progress'] });
    },
    onError: (error) => {
      toast.error('Failed to remove words from learning list');
      console.error('Remove from learning error:', error);
    },
  });

  // Search functionality
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['word-search', searchTerm, filters.language_code],
    queryFn: () => wordsAPI.searchWords(searchTerm, filters.language_code, 50),
    enabled: searchTerm.length > 2,
  });

  // Get learning word IDs for heart status
  const learningWordIds = new Set(
    learningProgress?.map(progress => progress.kazakh_word_id) || []
  );

  // Handle filter changes
  const handleFilterChange = (key: keyof WordFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      skip: 0 // Reset to first page when filters change
    }));
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const clearFilters = () => {
    setFilters({
      skip: 0,
      limit: 20,
      language_code: user?.main_language?.language_code || 'en'
    });
    setSearchTerm('');
  };

  // Handle word selection
  const toggleWordSelection = (wordId: number) => {
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

  // Get display data
  const displayWords = searchTerm.length > 2 ? searchResults : words;
  const isLoading = searchTerm.length > 2 ? searchLoading : wordsLoading;

  if (wordsError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading words. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kazakh Words</h1>
          <p className="text-gray-600">
            Explore our collection of {displayWords?.length || 0} Kazakh words
          </p>
        </div>

        {/* Bulk Actions */}
        {selectedWords.length > 0 && (
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
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

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search words..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
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
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category_id || ''}
                  onChange={(e) => handleFilterChange('category_id', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.translations?.[0]?.translated_name || category.category_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Word Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Word Type
                </label>
                <select
                  value={filters.word_type_id || ''}
                  onChange={(e) => handleFilterChange('word_type_id', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  {wordTypes?.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.translations?.[0]?.translated_name || type.type_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={filters.difficulty_level_id || ''}
                  onChange={(e) => handleFilterChange('difficulty_level_id', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Levels</option>
                  {difficultyLevels?.map((level) => (
                    <option key={level.id} value={level.id}>
                      Level {level.level_number} - {level.translations?.[0]?.translated_name || level.level_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
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
      {isLoading && <LoadingSpinner text="Loading words..." />}

      {/* Words Grid/List */}
      {!isLoading && displayWords && (
        <div className="space-y-4">
          {/* Results Info */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {searchTerm ? `Found ${displayWords.length} results for "${searchTerm}"` : `Showing ${displayWords.length} words`}
            </p>
            
            {/* Pagination Info */}
            <div className="text-sm text-gray-600">
              Page {Math.floor((filters.skip || 0) / (filters.limit || 20)) + 1}
            </div>
          </div>

          {/* Words Display */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayWords.map((word) => (
                <div key={word.id} className="relative">
                  {/* Selection Checkbox */}
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={selectedWords.includes(word.id)}
                      onChange={() => toggleWordSelection(word.id)}
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
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedWords(displayWords.map(w => w.id));
                            } else {
                              setSelectedWords([]);
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Word
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Translation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayWords.map((word) => (
                      <tr key={word.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedWords.includes(word.id)}
                            onChange={() => toggleWordSelection(word.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="kazakh-text font-semibold text-gray-900">
                              {word.kazakh_word}
                            </div>
                            {word.kazakh_cyrillic && (
                              <div className="cyrillic-text text-sm">
                                {word.kazakh_cyrillic}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {word.primary_translation}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="badge badge-gray">
                            {word.category_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="badge badge-blue">
                            {word.word_type_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`badge difficulty-${word.difficulty_level}`}>
                            {word.difficulty_level}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                if (learningWordIds.has(word.id)) {
                                  handleRemoveFromLearning(word.id);
                                } else {
                                  handleAddToLearning(word.id);
                                }
                              }}
                              className={`p-1 rounded ${
                                learningWordIds.has(word.id)
                                  ? 'text-red-500 hover:text-red-700'
                                  : 'text-gray-400 hover:text-red-500'
                              }`}
                              title={learningWordIds.has(word.id) ? 'Remove from learning' : 'Add to learning'}
                            >
                              <HeartIcon className={`h-5 w-5 ${learningWordIds.has(word.id) ? 'fill-current' : ''}`} />
                            </button>
                            <a
                              href={`/app/words/${word.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {!searchTerm && displayWords.length === (filters.limit || 20) && (
            <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, skip: Math.max(0, (prev.skip || 0) - (prev.limit || 20)) }))}
                  disabled={!filters.skip || filters.skip === 0}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
              </div>

              <div className="text-sm text-gray-700">
                Showing {(filters.skip || 0) + 1} to {(filters.skip || 0) + displayWords.length} results
              </div>

              <div className="flex items-center">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, skip: (prev.skip || 0) + (prev.limit || 20) }))}
                  disabled={displayWords.length < (filters.limit || 20)}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && displayWords && displayWords.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No words found' : 'No words available'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? `No words match your search "${searchTerm}". Try different keywords.`
              : 'There are no words to display with the current filters.'
            }
          </p>
          {(searchTerm || filters.category_id || filters.word_type_id || filters.difficulty_level_id) && (
            <button
              onClick={clearFilters}
              className="btn-primary"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default WordsPage;