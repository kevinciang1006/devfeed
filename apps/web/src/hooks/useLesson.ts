import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNextLesson, startLesson, completeLesson } from '../services/lesson.service'
import type { CompleteLessonRequest } from '@devfeed/shared'

export function useNextLesson(topicId: string) {
  return useQuery({
    queryKey: ['nextLesson', topicId],
    queryFn: () => getNextLesson(topicId),
    enabled: !!topicId,
  })
}

export function useStartLesson() {
  return useMutation({
    mutationFn: (lessonId: string) => startLesson(lessonId),
  })
}

export function useCompleteLesson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ lessonId, data }: { lessonId: string; data: CompleteLessonRequest }) =>
      completeLesson(lessonId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress'] })
      queryClient.invalidateQueries({ queryKey: ['nextLesson'] })
      queryClient.invalidateQueries({ queryKey: ['userTopics'] })
    },
  })
}
