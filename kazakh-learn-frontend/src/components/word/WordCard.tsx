// src/components/word/WordCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  HeartIcon, 
  SpeakerWaveIcon,
  BookmarkIcon,
  EyeIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartSolidIcon, 
  BookmarkIcon as BookmarkSolidIcon 
} from '@heroicons/react/24/solid';
import type { KazakhWordSummary } from '../../types/api';

interface WordCardProps {
  word: KazakhWordSummary;
  onAddToLearning?: (wordId: number) => void;
  onRemoveFromLearning?: (wordId: number) => void;
  isInLearningList?: boolean;
  showActions?: boolean;
  compact?: boolean;
}

const WordCard: React.FC<WordCardProps> = ({
  word,
  onAddToLearning,
  onRemoveFromLearning,
  isInLearningList = false,
  showActions = true,
  compact = false
}) => {
  const handleToggleLearning = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isInLearningList && onRemoveFromLearning) {
      onRemoveFromLearning(word.id);
    } else if (!isInLearningList && onAddToLearning) {
      onAddToLearning(word.id);
    }
  };

  const getDifficultyColor = (level: number): string => {
    const colors = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-orange-100 text-orange-800',
      5: 'bg-red-100 text-red-800'
    };
    return colors[level as keyof typeof colors] || colors[1];
  };

  // Compact version for list view
  if (compact) {
    return (
      <div className="p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center justify-between">
          <Link 
            to={`/app/words/${word.id}`}
            className="flex-1 min-w-0 flex items-center space-x-4"
          >
            {/* Word Text */}
            <div className="flex-1 min-w-0">
              <h3 className="kazakh-text font-semibold text-gray-900 truncate text-lg">
                {word.kazakh_word}
              </h3>
              {word.kazakh_cyrillic && (
                <p className="cyrillic-text text-sm text-gray-600 truncate">
                  {word.kazakh_cyrillic}
                </p>
              )}
              <p className="text-sm text-gray-700 truncate">
                {word.primary_translation}
              </p>
            </div>

            {/* Metadata */}
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                {word.category_name}
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                {word.word_type_name}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(word.difficulty_level)}`}>
                Level {word.difficulty_level}
              </span>
            </div>
          </Link>

          {/* Actions */}
          {showActions && (
            <div className="ml-4 flex items-center space-x-2">
              <button
                onClick={handleToggleLearning}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title={isInLearningList ? 'Remove from learning list' : 'Add to learning list'}
              >
                {isInLearningList ? (
                  <HeartSolidIcon className="h-5 w-5 text-red-500" />
                ) : (
                  <HeartIcon className="h-5 w-5" />
                )}
              </button>
              <Link
                to={`/app/words/${word.id}`}
                className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                title="View details"
              >
                <EyeIcon className="h-5 w-5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full card version for grid view
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all duration-200 group">
      <Link to={`/app/words/${word.id}`} className="block">
        {/* Image */}
        {word.primary_image && (
          <div className="aspect-video w-full mb-4 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={word.primary_image}
              alt={word.kazakh_word}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="kazakh-text font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-xl">
                {word.kazakh_word}
              </h3>
              {word.kazakh_cyrillic && (
                <p className="cyrillic-text text-sm text-gray-600 mt-1">
                  {word.kazakh_cyrillic}
                </p>
              )}
            </div>
            
            {showActions && (
              <button
                onClick={handleToggleLearning}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors ml-2"
                title={isInLearningList ? 'Remove from learning list' : 'Add to learning list'}
              >
                {isInLearningList ? (
                  <HeartSolidIcon className="h-5 w-5 text-red-500" />
                ) : (
                  <HeartIcon className="h-5 w-5" />
                )}
              </button>
            )}
          </div>

          {/* Translation */}
          {word.primary_translation && (
            <p className="text-gray-700 text-sm">
              {word.primary_translation}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                {word.category_name}
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                {word.word_type_name}
              </span>
            </div>
            
            <span className={`px-2 py-1 rounded-full ${getDifficultyColor(word.difficulty_level)}`}>
              Level {word.difficulty_level}
            </span>
          </div>
        </div>
      </Link>

      {/* Action buttons (visible on hover) */}
      {showActions && (
        <div className="mt-4 pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                title="Listen to pronunciation"
              >
                <SpeakerWaveIcon className="h-4 w-4" />
                <span>Listen</span>
              </button>
              
              <Link
                to={`/app/words/${word.id}`}
                className="flex items-center space-x-1 text-xs text-gray-500 hover:text-green-600 transition-colors"
                title="View details"
              >
                <EyeIcon className="h-4 w-4" />
                <span>View</span>
              </Link>
            </div>
            
            <button
              onClick={handleToggleLearning}
              className={`flex items-center space-x-1 text-xs transition-colors ${
                isInLearningList 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-gray-500 hover:text-red-600'
              }`}
              title={isInLearningList ? 'Remove from learning' : 'Add to learning'}
            >
              {isInLearningList ? (
                <BookmarkSolidIcon className="h-4 w-4" />
              ) : (
                <BookmarkIcon className="h-4 w-4" />
              )}
              <span>{isInLearningList ? 'Remove' : 'Save'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordCard;