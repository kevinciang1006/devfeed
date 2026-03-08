import { useMutation, useQueryClient } from '@tanstack/react-query'
import { submitQuizAttempt } from '../services/quiz.service'

export function useSubmitQuiz() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ quizId, answers }: { quizId: string; answers: number[] }) =>
      submitQuizAttempt(quizId, { answers }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress'] })
      queryClient.invalidateQueries({ queryKey: ['userTopics'] })
    },
  })
}
