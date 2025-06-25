// src/components/dashboard/LearningGoals.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  TrophyIcon, 
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  BookOpenIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { learningAPI } from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';

interface NewGoal {
  goal_type: string;
  target_value: number;
  target_date?: string;
  category_id?: number;
  difficulty_level_id?: number;
}

const LearningGoals: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState<NewGoal>({
    goal_type: 'daily_words',
    target_value: 10,
  });

  // Fetch user's learning goals
  const { data: goals, isLoading } = useQuery({
    queryKey: ['learning-goals'],
    queryFn: () => learningAPI.getProgress(), // You'll need to add a getGoals method
  });

  // Mock goals for demonstration
  const mockGoals = [
    {
      id: 1,
      goal_type: 'daily_words',
      target_value: 10,
      current_value: 7,
      is_completed: false,
      target_date: null,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      goal_type: 'weekly_practice',
      target_value: 5,
      current_value: 3,
      is_completed: false,
      target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      goal_type: 'category_mastery',
      target_value: 50,
      current_value: 50,
      is_completed: true,
      target_date: null,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const createGoalMutation = useMutation({
    mutationFn: (goalData: NewGoal) => {
      // This would be a real API call
      return Promise.resolve({ ...goalData, id: Date.now(), current_value: 0, is_completed: false });
    },
    onSuccess: () => {
      toast.success('Goal created successfully!');
      queryClient.invalidateQueries({ queryKey: ['learning-goals'] });
      setShowAddGoal(false);
      setNewGoal({ goal_type: 'daily_words', target_value: 10 });
    },
    onError: () => {
      toast.error('Failed to create goal');
    },
  });

  const getGoalIcon = (goalType: string) => {
    switch (goalType) {
      case 'daily_words':
        return <BookOpenIcon className="h-5 w-5 text-blue-600" />;
      case 'weekly_practice':
        return <AcademicCapIcon className="h-5 w-5 text-green-600" />;
      case 'category_mastery':
        return <TrophyIcon className="h-5 w-5 text-purple-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getGoalTitle = (goalType: string) => {
    switch (goalType) {
      case 'daily_words':
        return 'Daily Words';
      case 'weekly_practice':
        return 'Weekly Practice';
      case 'category_mastery':
        return 'Category Mastery';
      default:
        return goalType.replace('_', ' ');
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min(100, Math.round((current / target) * 100));
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    createGoalMutation.mutate(newGoal);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Goals</h3>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <TrophyIcon className="h-5 w-5 text-yellow-500 mr-2" />
          Learning Goals
        </h3>
        <button
          onClick={() => setShowAddGoal(true)}
          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          title="Add new goal"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {mockGoals.map((goal) => (
          <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                {getGoalIcon(goal.goal_type)}
                <div>
                  <h4 className="font-medium text-gray-900">
                    {getGoalTitle(goal.goal_type)}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {goal.current_value} / {goal.target_value}
                    {goal.goal_type === 'daily_words' && ' words'}
                    {goal.goal_type === 'weekly_practice' && ' sessions'}
                    {goal.goal_type === 'category_mastery' && ' words'}
                  </p>
                </div>
              </div>
              
              {goal.is_completed && (
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
              )}
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{getProgressPercentage(goal.current_value, goal.target_value)}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-fill ${
                    goal.is_completed ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{
                    width: `${getProgressPercentage(goal.current_value, goal.target_value)}%`,
                  }}
                />
              </div>
            </div>

            {/* Goal Details */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                Created {new Date(goal.created_at).toLocaleDateString()}
              </span>
              {goal.target_date && !goal.is_completed && (
                <span>
                  Due {new Date(goal.target_date).toLocaleDateString()}
                </span>
              )}
              {goal.is_completed && (
                <span className="text-green-600 font-medium">
                  ✓ Completed
                </span>
              )}
            </div>
          </div>
        ))}

        {/* No goals message */}
        {mockGoals.length === 0 && (
          <div className="text-center py-8">
            <TrophyIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No goals set</h4>
            <p className="text-gray-600 mb-4">
              Set learning goals to track your progress and stay motivated!
            </p>
            <button
              onClick={() => setShowAddGoal(true)}
              className="btn-primary text-sm"
            >
              Create Your First Goal
            </button>
          </div>
        )}
      </div>

      {/* Add Goal Form */}
      {showAddGoal && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-4">Create New Goal</h4>
          <form onSubmit={handleCreateGoal} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Goal Type
              </label>
              <select
                value={newGoal.goal_type}
                onChange={(e) => setNewGoal(prev => ({ ...prev, goal_type: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="daily_words">Daily Words</option>
                <option value="weekly_practice">Weekly Practice Sessions</option>
                <option value="category_mastery">Category Mastery</option>
                <option value="monthly_streak">Monthly Streak</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Value
              </label>
              <input
                type="number"
                min="1"
                value={newGoal.target_value}
                onChange={(e) => setNewGoal(prev => ({ ...prev, target_value: parseInt(e.target.value) }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter target number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Date (Optional)
              </label>
              <input
                type="date"
                value={newGoal.target_date || ''}
                onChange={(e) => setNewGoal(prev => ({ ...prev, target_date: e.target.value || undefined }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="submit"
                disabled={createGoalMutation.isPending}
                className="btn-primary text-sm flex-1"
              >
                {createGoalMutation.isPending ? 'Creating...' : 'Create Goal'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddGoal(false);
                  setNewGoal({ goal_type: 'daily_words', target_value: 10 });
                }}
                className="btn-secondary text-sm flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quick Goal Templates */}
      {!showAddGoal && mockGoals.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Goals</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setNewGoal({ goal_type: 'daily_words', target_value: 5 });
                setShowAddGoal(true);
              }}
              className="text-left p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="text-sm font-medium text-blue-900">5 words/day</div>
              <div className="text-xs text-blue-600">Beginner pace</div>
            </button>
            <button
              onClick={() => {
                setNewGoal({ goal_type: 'weekly_practice', target_value: 7 });
                setShowAddGoal(true);
              }}
              className="text-left p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="text-sm font-medium text-green-900">Daily practice</div>
              <div className="text-xs text-green-600">7 sessions/week</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningGoals;