// src/pages/learning/PracticePage.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  PlayIcon, 
  PauseIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  SpeakerWaveIcon,
  ClockIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

import { practiceAPI, learningAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface PracticeWord {
  id: number;
  kazakh_word: string;
  kazakh_cyrillic?: string;
  translation: string;
  pronunciation?: string;
  image_url?: string;
  difficulty_level: number;
}

const PracticePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  // Session state
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [sessionWords, setSessionWords] = useState<PracticeWord[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionResults, setSessionResults] = useState<{
    word_id: number;
    correct: boolean;
    user_answer: string;
    response_time: number;
  }[]>([]);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [isPaused, setIsPaused] = useState(false);

  // URL parameters
  const practiceType = searchParams.get('type') || 'practice';
  const categoryId = searchParams.get('category') ? parseInt(searchParams.get('category')!) : undefined;
  const wordCount = parseInt(searchParams.get('count') || '10');

  // Start practice session
  const startSessionMutation = useMutation({
    mutationFn: () => practiceAPI.startPracticeSession(
      practiceType,
      wordCount,
      categoryId,
      undefined,
      true,
      user?.main_language?.language_code || 'en'
    ),
    onSuccess: (data) => {
      setSessionId(data.session_id);
      setSessionWords(data.words);
      setStartTime(Date.now());
      setQuestionStartTime(Date.now());
      toast.success('Practice session started!');
    },
    onError: () => {
      toast.error('Failed to start practice session');
    },
  });

  // Submit answer
  const submitAnswerMutation = useMutation({
    mutationFn: (data: {
      sessionId: number;
      wordId: number;
      wasCorrect: boolean;
      userAnswer: string;
      correctAnswer: string;
      responseTime: number;
    }) => practiceAPI.submitPracticeAnswer(
      data.sessionId,
      data.wordId,
      data.wasCorrect,
      'translation',
      data.userAnswer,
      data.correctAnswer,
      data.responseTime
    ),
    onSuccess: () => {
      // Answer submitted successfully
    },
    onError: () => {
      toast.error('Failed to submit answer');
    },
  });

  // Finish session
  const finishSessionMutation = useMutation({
    mutationFn: (data: { sessionId: number; duration: number }) =>
      practiceAPI.finishPracticeSession(data.sessionId, data.duration),
    onSuccess: () => {
      // Session finished
    },
  });

  // Initialize session on component mount
  useEffect(() => {
    if (!sessionId) {
      startSessionMutation.mutate();
    }
  }, []);

  const currentWord = sessionWords[currentWordIndex];
  const isLastWord = currentWordIndex === sessionWords.length - 1;
  const progress = sessionWords.length > 0 ? ((currentWordIndex + 1) / sessionWords.length) * 100 : 0;

  const handleSubmitAnswer = () => {
    if (!currentWord || !sessionId) return;

    const responseTime = Date.now() - questionStartTime;
    const correctAnswer = currentWord.translation.toLowerCase().trim();
    const userAnswerLower = userAnswer.toLowerCase().trim();
    const isCorrect = userAnswerLower === correctAnswer;

    // Submit answer to API
    submitAnswerMutation.mutate({
      sessionId,
      wordId: currentWord.id,
      wasCorrect: isCorrect,
      userAnswer,
      correctAnswer: currentWord.translation,
      responseTime,
    });

    // Store result locally
    setSessionResults(prev => [...prev, {
      word_id: currentWord.id,
      correct: isCorrect,
      user_answer: userAnswer,
      response_time: responseTime,
    }]);

    setShowAnswer(true);
  };

  const handleNextWord = () => {
    if (isLastWord) {
      handleFinishSession();
    } else {
      setCurrentWordIndex(prev => prev + 1);
      setUserAnswer('');
      setShowAnswer(false);
      setQuestionStartTime(Date.now());
    }
  };

  const handleFinishSession = () => {
    if (sessionId) {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      finishSessionMutation.mutate({ sessionId, duration });
    }

    // Navigate to results
    const correct = sessionResults.filter(r => r.correct).length;
    const total = sessionResults.length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    navigate('/app/progress', {
      state: {
        sessionCompleted: true,
        results: {
          correct,
          total,
          accuracy,
          duration: Math.floor((Date.now() - startTime) / 1000),
        }
      }
    });
  };

  const handlePlayAudio = () => {
    if (currentWord?.pronunciation) {
      // This would play audio if available
      toast.info('Audio feature coming soon!');
    }
  };

  const handleSkip = () => {
    if (currentWord && sessionId) {
      // Submit as incorrect
      submitAnswerMutation.mutate({
        sessionId,
        wordId: currentWord.id,
        wasCorrect: false,
        userAnswer: 'skipped',
        correctAnswer: currentWord.translation,
        responseTime: Date.now() - questionStartTime,
      });

      setSessionResults(prev => [...prev, {
        word_id: currentWord.id,
        correct: false,
        user_answer: 'skipped',
        response_time: Date.now() - questionStartTime,
      }]);
    }

    handleNextWord();
  };

  if (startSessionMutation.isPending) {
    return <LoadingSpinner fullScreen text="Starting your practice session..." />;
  }

  if (startSessionMutation.error || !currentWord) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Unable to start practice session
        </h2>
        <p className="text-gray-600 mb-6">
          Please try again or check your learning list.
        </p>
        <button
          onClick={() => navigate('/app/learn')}
          className="btn-primary"
        >
          Back to Learning
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Session Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 capitalize">
              {practiceType} Session
            </h1>
            <p className="text-gray-600">
              Question {currentWordIndex + 1} of {sessionWords.length}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Correct: {sessionResults.filter(r => r.correct).length} / {sessionResults.length}
            </div>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              {isPaused ? <PlayIcon className="h-5 w-5" /> : <PauseIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Practice Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        {/* Word Display */}
        <div className="text-center mb-8">
          {/* Word Image */}
          {currentWord.image_url && (
            <div className="w-48 h-32 mx-auto mb-6 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={currentWord.image_url}
                alt={currentWord.kazakh_word}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Kazakh Word */}
          <h2 className="kazakh-text text-4xl font-bold text-gray-900 mb-2">
            {currentWord.kazakh_word}
          </h2>
          
          {/* Cyrillic */}
          {currentWord.kazakh_cyrillic && (
            <p className="cyrillic-text text-xl text-gray-600 mb-4">
              {currentWord.kazakh_cyrillic}
            </p>
          )}

          {/* Pronunciation */}
          {currentWord.pronunciation && (
            <div className="flex items-center justify-center space-x-2 mb-4">
              <span className="text-gray-600">/{currentWord.pronunciation}/</span>
              <button
                onClick={handlePlayAudio}
                className="p-1 text-blue-600 hover:text-blue-700"
              >
                <SpeakerWaveIcon className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Difficulty Badge */}
          <span className={`badge difficulty-${currentWord.difficulty_level} inline-block mb-6`}>
            Level {currentWord.difficulty_level}
          </span>
        </div>

        {/* Answer Section */}
        {!showAnswer ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What does this word mean in English?
              </label>
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && userAnswer.trim()) {
                    handleSubmitAnswer();
                  }
                }}
                placeholder="Type your answer..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-lg"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={handleSkip}
                className="btn-secondary"
              >
                Skip
              </button>
              <button
                onClick={handleSubmitAnswer}
                disabled={!userAnswer.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Answer
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Answer Result */}
            <div className="text-center">
              {sessionResults[sessionResults.length - 1]?.correct ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-2 text-green-600">
                    <CheckCircleIcon className="h-8 w-8" />
                    <span className="text-2xl font-bold">Correct! 🎉</span>
                  </div>
                  <p className="text-lg text-gray-700">
                    <strong>{currentWord.kazakh_word}</strong> means <strong>{currentWord.translation}</strong>
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-2 text-red-600">
                    <XCircleIcon className="h-8 w-8" />
                    <span className="text-2xl font-bold">Not quite right</span>
                  </div>
                  <div className="text-lg text-gray-700">
                    <p>Your answer: <span className="text-red-600">{userAnswer}</span></p>
                    <p>Correct answer: <span className="text-green-600 font-semibold">{currentWord.translation}</span></p>
                  </div>
                </div>
              )}
            </div>

            {/* Next Button */}
            <div className="text-center">
              <button
                onClick={handleNextWord}
                className="btn-primary flex items-center space-x-2 mx-auto"
              >
                {isLastWord ? (
                  <>
                    <TrophyIcon className="h-5 w-5" />
                    <span>Finish Session</span>
                  </>
                ) : (
                  <>
                    <span>Next Word</span>
                    <ArrowRightIcon className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Session Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Progress</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{currentWordIndex + 1}</div>
            <div className="text-sm text-gray-600">Current</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {sessionResults.filter(r => r.correct).length}
            </div>
            <div className="text-sm text-gray-600">Correct</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {sessionResults.filter(r => !r.correct).length}
            </div>
            <div className="text-sm text-gray-600">Incorrect</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticePage;