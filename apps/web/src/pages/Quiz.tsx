import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useSubmitQuiz } from '../hooks/useQuiz'
import { completeSession } from '../services/session.service'
import type { Lesson, SubmitQuizResponse } from '@devfeed/shared'

export function Quiz() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const lesson = (location.state as { lesson?: Lesson })?.lesson
  const quiz = lesson?.quiz

  const submitQuiz = useSubmitQuiz()
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<SubmitQuizResponse | null>(null)

  if (!quiz || !quiz.questions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted">No quiz available</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-accent hover:text-white transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  const allAnswered = quiz.questions.length === Object.keys(answers).length

  const handleSubmit = async () => {
    const answerArray = quiz.questions.map((_, i) => answers[i] ?? -1)
    const res = await submitQuiz.mutateAsync({ quizId: quiz.id, answers: answerArray })
    setResult(res)
    setSubmitted(true)
  }

  const handleContinue = async () => {
    try {
      await completeSession({
        topicId: topicId!,
        quizAttemptId: result?.quizAttemptId,
      })
    } catch {}
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-muted hover:text-white text-sm transition-colors"
        >
          &larr; Back
        </button>
        <span className="font-mono text-[10px] text-muted tracking-widest uppercase">Quiz</span>
      </div>

      {!submitted ? (
        <>
          <div className="flex flex-col gap-6">
            {quiz.questions.map((q, qIndex) => (
              <div key={q.id} className="bg-surface border border-border rounded-xl p-5">
                <p className="text-white font-semibold mb-4">
                  {qIndex + 1}. {q.question}
                </p>
                <div className="flex flex-col gap-2">
                  {q.options.map((option, oIndex) => {
                    const selected = answers[qIndex] === oIndex
                    return (
                      <button
                        key={oIndex}
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [qIndex]: oIndex }))
                        }
                        className={`text-left p-3 rounded-lg border transition-colors text-sm ${
                          selected
                            ? 'border-accent text-accent bg-accent/10'
                            : 'border-border text-text hover:border-muted'
                        }`}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitQuiz.isPending}
              className="px-6 py-2 bg-accent text-white rounded-lg font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent-hover transition-colors"
            >
              {submitQuiz.isPending ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </>
      ) : (
        result && (
          <div>
            {/* Score card */}
            <div className="bg-surface border border-border rounded-2xl p-8 text-center mb-6">
              <div className="font-mono font-black text-5xl text-white mb-2">
                {result.score}/{result.total}
              </div>
              <div className="font-mono text-[10px] text-muted tracking-widest uppercase">
                {result.passed ? 'Passed' : 'Try Again'}
              </div>
            </div>

            {/* Per-question results */}
            <div className="flex flex-col gap-4">
              {quiz.questions.map((q, qIndex) => {
                const isCorrect = answers[qIndex] === result.correctAnswers[qIndex]
                return (
                  <div key={q.id} className="bg-surface border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`font-mono text-xs px-2 py-0.5 rounded ${
                          isCorrect
                            ? 'bg-success/20 text-success'
                            : 'bg-error/20 text-error'
                        }`}
                      >
                        {isCorrect ? 'CORRECT' : 'INCORRECT'}
                      </span>
                    </div>
                    <p className="text-white text-sm mb-2">{q.question}</p>
                    {!isCorrect && (
                      <p className="text-success text-xs mb-2">
                        Correct answer: {q.options[result.correctAnswers[qIndex]]}
                      </p>
                    )}
                    <p className="text-muted text-xs">{result.explanations[qIndex]}</p>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleContinue}
                className="px-6 py-2 bg-accent text-white rounded-lg font-semibold hover:bg-accent-hover transition-colors"
              >
                Continue &rarr;
              </button>
            </div>
          </div>
        )
      )}
    </div>
  )
}
