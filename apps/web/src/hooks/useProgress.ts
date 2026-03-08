import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProgress } from '../services/progress.service'
import { getUserTopics, saveUserTopics } from '../services/topic.service'
import type { SaveUserTopicsRequest } from '@devfeed/shared'

export function useProgress() {
  return useQuery({
    queryKey: ['progress'],
    queryFn: getProgress,
  })
}

export function useUserTopics() {
  return useQuery({
    queryKey: ['userTopics'],
    queryFn: getUserTopics,
  })
}

export function useSaveTopics() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SaveUserTopicsRequest) => saveUserTopics(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userTopics'] })
    },
  })
}
