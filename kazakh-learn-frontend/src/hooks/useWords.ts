import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wordsAPI, learningAPI } from '../services/api';
import type { WordFilters } from '../types/api';

export const useWords = (filters: WordFilters = {}) => {
  return useQuery({
    queryKey: ['words', filters],
    queryFn: () => wordsAPI.getWords(filters),
  });
};

export const useWord = (id: number, languageCode?: string) => {
  return useQuery({
    queryKey: ['word', id, languageCode],
    queryFn: () => wordsAPI.getWord(id, languageCode),
    enabled: !!id,
  });
};

export const useAddToLearning = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ wordIds, status }: { wordIds: number[], status?: string }) =>
      learningAPI.addWordToLearning(wordIds, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-progress'] });
    },
  });
};