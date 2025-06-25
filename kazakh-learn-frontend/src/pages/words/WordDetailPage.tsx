// src/pages/words/WordDetailPage.tsx
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeftIcon,
  SpeakerWaveIcon,
  HeartIcon,
  BookmarkIcon,
  ShareIcon,
  PhotoIcon,
  ChatBubbleLeftIcon,
  AcademicCapIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { toast } from 'sonner';

import { wordsAPI, learningAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { KazakhWord, UserWordProgress } from '../../types/api';

import LoadingSpinner from '../../components/ui/LoadingSpinner';

const WordDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const wordId = parseInt(id || '0');

  const [activeTab, setActiveTab] = useState<'overview' | 'examples' | 'progress'>('overview');
  const [notes, setNotes] = useState('');
  const [difficultyRating, setDifficultyRating] = useState<string>('');

  // Fetch word details
  const { data: word, isLoading: wordLoading, error: wordError } = useQuery({
    queryKey: ['word', wordId, user?.main_language?.language_code],
    queryFn: () => wordsAPI.getWord(wordId, user?.main_language?.language_code),
    enabled: !!wordId,
  });

  // Fetch user's progress for this word
  const { data: progress } = useQuery({
    queryKey: ['word-progress', wordId],
    queryFn: async () => {
      const allProgress = await learningAPI.getProgress();
      return allProgress.find(p => p.kazakh_word_id === wordId);
    },
    enabled: !!wordId,
  });

  // Mutations
  const addToLearningMutation = useMutation({
    mutationFn: (wordIds: number[]) => learningAPI.addWordToLearning(wordIds),
    onSuccess: () => {
      toast.success('Word added to learning list!');
      queryClient.invalidateQueries({ queryKey: ['word-progress', wordId] });
      queryClient.invalidateQueries({ queryKey: ['learning-progress'] });
    },
    onError: () => toast.error('Failed to add word to learning list'),
  });

  const removeFromLearningMutation = useMutation({
    mutationFn: (wordIds: number[]) => learningAPI.removeWordFromLearning(wordIds),
    onSuccess: () => {
      toast.success('Word removed from learning list!');
      queryClient.invalidateQueries({ queryKey: ['word-progress', wordId] });
      queryClient.invalidateQueries({ queryKey: ['learning-progress'] });
    },
    onError: () => toast.error('Failed to remove word from learning list'),
  });

  const updateProgressMutation = useMutation({
    mutationFn: (data: any) => learningAPI.updateWordProgress(wordId, data),
    onSuccess: () => {
      toast.success('Progress updated!');
      queryClient.invalidateQueries({ queryKey: ['word-progress', wordId] });
    },
    onError: () => toast.error('Failed to update progress'),
  });

  // Event handlers
  const handleToggleLearning = () => {
    if (progress) {
      removeFromLearningMutation.mutate([wordId]);
    } else {
      addToLearningMutation.mutate([wordId]);
    }
  };

  const handlePlayAudio = () => {
    if (word?.pronunciations?.[0]?.audio_file_path) {
      const audio = new Audio(word.pronunciations[0].audio_file_path);
      audio.play().catch(() => {
        toast.error('Could not play audio');
      });
    } else {
      toast.info('Audio not available for this word');
    }
  };

  const handleUpdateNotes = () => {
    if (progress) {
      updateProgressMutation.mutate({ user_notes: notes });
    }
  };

  const handleUpdateDifficulty = (rating: string) => {
    if (progress) {
      updateProgressMutation.mutate({ difficulty_rating: rating });
      setDifficultyRating(rating);
    }
  };

  const handleMarkAsLearned = () => {
    if (progress) {
      updateProgressMutation.mutate({ status: 'learned' });
    } else {
      // Add to learning list first, then mark as learned
      addToLearningMutation.mutate([wordId]);
      setTimeout(() => {
        updateProgressMutation.mutate({ status: 'learned' });
      }, 1000);
    }
  };

  const handleShare = async () => {
    if (navigator.share && word) {
      try {
        await navigator.share({
          title: `Learn Kazakh: ${word.kazakh_word}`,
          text: `${word.kazakh_word} means "${word.translations?.[0]?.translation}" in Kazakh`,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } else if (word) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  // Loading and error states
  if (wordLoading) {
    return <LoadingSpinner fullScreen text="Loading word details..." />;
  }

  if (wordError || !word) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Word not found</h2>
        <p className="text-gray-600 mb-6">
          The word you're looking for doesn't exist or has been removed.
        </p>
        <button
          onClick={() => navigate('/app/words')}
          className="btn-primary"
        >
          Browse Words
        </button>
      </div>
    );
  }

  const getDifficultyColor = (level: number) => {
    const colors = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-orange-100 text-orange-800',
      5: 'bg-red-100 text-red-800'
    };
    return colors[level as keyof typeof colors] || colors[1];
  };

  const getStatusColor = (status?: string) => {
    const colors = {
      'want_to_learn': 'bg-gray-100 text-gray-800',
      'learning': 'bg-blue-100 text-blue-800',
      'learned': 'bg-green-100 text-green-800',
      'mastered': 'bg-purple-100 text-purple-800',
      'review': 'bg-orange-100 text-orange-800'
    };
    return colors[status as keyof typeof colors] || colors['want_to_learn'];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/app/words')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span>Back to Words</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleShare}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Share word"
          >
            <ShareIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Word Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Word Header */}
        <div className="p-8 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              {/* Main Word */}
              <div className="mb-4">
                <h1 className="kazakh-text text-4xl font-bold text-gray-900 mb-2">
                  {word.kazakh_word}
                </h1>
                {word.kazakh_cyrillic && (
                  <p className="cyrillic-text text-xl text-gray-600">
                    {word.kazakh_cyrillic}
                  </p>
                )}
              </div>

              {/* Translation */}
              {word.translations?.[0] && (
                <div className="mb-4">
                  <p className="text-2xl text-gray-900 font-medium mb-2">
                    {word.translations[0].translation}
                  </p>
                  {word.translations[0].alternative_translations && (
                    <p className="text-gray-600">
                      Also: {word.translations[0].alternative_translations.join(', ')}
                    </p>
                  )}
                </div>
              )}

              {/* Pronunciation */}
              {word.pronunciations?.[0] && (
                <div className="flex items-center space-x-3">
                  <span className="text-gray-600">
                    /{word.pronunciations[0].pronunciation}/
                  </span>
                  <button
                    onClick={handlePlayAudio}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <SpeakerWaveIcon className="h-5 w-5" />
                    <span className="text-sm">Listen</span>
                  </button>
                </div>
              )}
            </div>

            {/* Word Image */}
            {word.images?.[0] && (
              <div className="mt-6 lg:mt-0 lg:ml-8">
                <div className="w-48 h-32 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={word.images[0].image_path}
                    alt={word.images[0].alt_text || word.kazakh_word}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Word Metadata */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className={`badge ${getDifficultyColor(word.difficulty_level.level_number)}`}>
              Level {word.difficulty_level.level_number}
            </span>
            <span className="badge badge-blue">
              {word.category.translations?.[0]?.translated_name || word.category.category_name}
            </span>
            <span className="badge badge-gray">
              {word.word_type.translations?.[0]?.translated_name || word.word_type.type_name}
            </span>
            {progress && (
              <span className={`badge ${getStatusColor(progress.status)}`}>
                {progress.status.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-8 py-4 bg-white border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleToggleLearning}
              disabled={addToLearningMutation.isPending || removeFromLearningMutation.isPending}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                progress
                  ? 'bg-red-50 text-red-700 hover:bg-red-100'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              {progress ? (
                <HeartSolidIcon className="h-5 w-5" />
              ) : (
                <HeartIcon className="h-5 w-5" />
              )}
              <span>
                {progress ? 'Remove from Learning' : 'Add to Learning'}
              </span>
            </button>

            {progress && (
              <button
                onClick={handleMarkAsLearned}
                disabled={updateProgressMutation.isPending}
                className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors"
              >
                <CheckCircleIcon className="h-5 w-5" />
                <span>Mark as Learned</span>
              </button>
            )}

            <Link
              to={`/app/practice?word=${wordId}`}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <AcademicCapIcon className="h-5 w-5" />
              <span>Practice This Word</span>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-8">
            {[
              { id: 'overview', name: 'Overview', icon: PhotoIcon },
              { id: 'examples', name: 'Examples', icon: ChatBubbleLeftIcon },
              { id: 'progress', name: 'My Progress', icon: ClockIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Word Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Word Details</h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Category</dt>
                      <dd className="text-sm text-gray-900">
                        {word.category.translations?.[0]?.translated_name || word.category.category_name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Word Type</dt>
                      <dd className="text-sm text-gray-900">
                        {word.word_type.translations?.[0]?.translated_name || word.word_type.type_name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Difficulty Level</dt>
                      <dd className="text-sm text-gray-900">
                        Level {word.difficulty_level.level_number} - {word.difficulty_level.translations?.[0]?.translated_name || word.difficulty_level.level_name}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* All Images */}
                {word.images && word.images.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Images</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {word.images.slice(0, 4).map((image, index) => (
                        <div
                          key={image.id}
                          className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                        >
                          <img
                            src={image.image_path}
                            alt={image.alt_text || word.kazakh_word}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* All Translations */}
              {word.translations && word.translations.length > 1 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">All Translations</h3>
                  <div className="space-y-2">
                    {word.translations.map((translation, index) => (
                      <div key={translation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900">{translation.translation}</span>
                          {translation.alternative_translations && (
                            <p className="text-sm text-gray-600 mt-1">
                              Also: {translation.alternative_translations.join(', ')}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 uppercase">
                          {translation.language_code}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Pronunciations */}
              {word.pronunciations && word.pronunciations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Pronunciations</h3>
                  <div className="space-y-2">
                    {word.pronunciations.map((pronunciation, index) => (
                      <div key={pronunciation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="font-mono text-gray-900">
                            /{pronunciation.pronunciation}/
                          </span>
                          {pronunciation.pronunciation_system && (
                            <span className="text-xs text-gray-500">
                              ({pronunciation.pronunciation_system})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 uppercase">
                            {pronunciation.language_code}
                          </span>
                          {pronunciation.audio_file_path && (
                            <button
                              onClick={() => {
                                const audio = new Audio(pronunciation.audio_file_path!);
                                audio.play().catch(() => toast.error('Could not play audio'));
                              }}
                              className="p-1 text-blue-600 hover:text-blue-700"
                            >
                              <SpeakerWaveIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'examples' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Example Sentences</h3>
                <span className="text-sm text-gray-500">
                  {word.example_sentences?.length || 0} examples
                </span>
              </div>

              {word.example_sentences && word.example_sentences.length > 0 ? (
                <div className="space-y-4">
                  {word.example_sentences.map((sentence, index) => (
                    <div key={sentence.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="kazakh-text text-lg text-gray-900 mb-2">
                            {sentence.kazakh_sentence}
                          </p>
                          {sentence.translations?.[0] && (
                            <p className="text-gray-700">
                              {sentence.translations[0].translated_sentence}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <span className={`badge difficulty-${sentence.difficulty_level}`}>
                            Level {sentence.difficulty_level}
                          </span>
                        </div>
                      </div>

                      {sentence.usage_context && (
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span className="font-medium">Context:</span>
                          <span>{sentence.usage_context}</span>
                        </div>
                      )}

                      {/* Additional translations */}
                      {sentence.translations && sentence.translations.length > 1 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs font-medium text-gray-500 mb-2">Other translations:</p>
                          <div className="space-y-1">
                            {sentence.translations.slice(1).map((translation, idx) => (
                              <div key={translation.id} className="flex items-center justify-between text-sm">
                                <span className="text-gray-700">{translation.translated_sentence}</span>
                                <span className="text-xs text-gray-500 uppercase">{translation.language_code}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ChatBubbleLeftIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No example sentences available for this word yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="space-y-6">
              {progress ? (
                <>
                  {/* Progress Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-600">{progress.times_seen}</div>
                      <div className="text-sm text-blue-600">Times Seen</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">{progress.times_correct}</div>
                      <div className="text-sm text-green-600">Correct Answers</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-orange-600">
                        {progress.times_seen > 0 ? Math.round((progress.times_correct / progress.times_seen) * 100) : 0}%
                      </div>
                      <div className="text-sm text-orange-600">Accuracy Rate</div>
                    </div>
                  </div>

                  {/* Progress Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Learning Status</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Current Status:</span>
                          <span className={`ml-2 badge ${getStatusColor(progress.status)}`}>
                            {progress.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Added:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {new Date(progress.added_at).toLocaleDateString()}
                          </span>
                        </div>
                        {progress.first_learned_at && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">First Learned:</span>
                            <span className="ml-2 text-sm text-gray-900">
                              {new Date(progress.first_learned_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {progress.last_practiced_at && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">Last Practiced:</span>
                            <span className="ml-2 text-sm text-gray-900">
                              {new Date(progress.last_practiced_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {progress.next_review_at && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">Next Review:</span>
                            <span className="ml-2 text-sm text-gray-900">
                              {new Date(progress.next_review_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Spaced Repetition</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Interval:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {progress.repetition_interval} days
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Ease Factor:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {progress.ease_factor.toFixed(2)}
                          </span>
                        </div>
                        {progress.difficulty_rating && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">Your Difficulty Rating:</span>
                            <span className="ml-2 text-sm text-gray-900 capitalize">
                              {progress.difficulty_rating.replace('_', ' ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Difficulty Rating */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Rate Difficulty</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      How difficult is this word for you to remember?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'very_easy', label: 'Very Easy', color: 'bg-green-100 text-green-800' },
                        { value: 'easy', label: 'Easy', color: 'bg-blue-100 text-blue-800' },
                        { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
                        { value: 'hard', label: 'Hard', color: 'bg-orange-100 text-orange-800' },
                        { value: 'very_hard', label: 'Very Hard', color: 'bg-red-100 text-red-800' }
                      ].map((rating) => (
                        <button
                          key={rating.value}
                          onClick={() => handleUpdateDifficulty(rating.value)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            progress.difficulty_rating === rating.value
                              ? rating.color + ' ring-2 ring-offset-2 ring-blue-500'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {rating.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Personal Notes</h4>
                    <div className="space-y-3">
                      <textarea
                        value={notes || progress.user_notes || ''}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add your personal notes about this word..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                      />
                      <button
                        onClick={handleUpdateNotes}
                        disabled={updateProgressMutation.isPending}
                        className="btn-primary"
                      >
                        Save Notes
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    Add this word to your learning list to track your progress.
                  </p>
                  <button
                    onClick={() => addToLearningMutation.mutate([wordId])}
                    disabled={addToLearningMutation.isPending}
                    className="btn-primary"
                  >
                    Add to Learning List
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related Words */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Words</h3>
        <div className="text-center py-8 text-gray-500">
          <BookmarkIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p>Related words feature coming soon!</p>
        </div>
      </div>
    </div>
  );
};

export default WordDetailPage;