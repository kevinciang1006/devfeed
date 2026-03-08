import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useNextLesson, useStartLesson, useCompleteLesson } from '../hooks/useLesson'
import { LoadingPulse } from '../components/shared/LoadingPulse'
import { DifficultyBadge } from '../components/shared/DifficultyBadge'
import type { Difficulty } from '@devfeed/shared'

export function Learn() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const { data, isLoading, refetch } = useNextLesson(topicId!)
  const startLesson = useStartLesson()
  const completeLesson = useCompleteLesson()
  const [lessonReadId, setLessonReadId] = useState<string | null>(null)
  const startedRef = useRef(false)

  const lesson = data?.lesson

  useEffect(() => {
    if (lesson && !startedRef.current) {
      startedRef.current = true
      startLesson.mutateAsync(lesson.id).then((res) => {
        setLessonReadId(res.lessonReadId)
      })
    }
  }, [lesson])

  useEffect(() => {
    return () => {
      if (lessonReadId && lesson) {
        completeLesson.mutate({
          lessonId: lesson.id,
          data: { lessonReadId },
        })
      }
    }
  }, [lessonReadId, lesson])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingPulse label="Generating Lesson" />
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted">No lesson available</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-accent hover:text-white transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-muted hover:text-white text-sm transition-colors"
        >
          &larr; Back
        </button>
        <DifficultyBadge difficulty={lesson.difficulty as Difficulty} />
      </div>

      {/* Lesson card */}
      <div className="bg-surface border border-border rounded-2xl p-6 md:p-8">
        {/* Concept pill */}
        <div className="inline-block px-3 py-1 border border-accent text-accent rounded-full text-xs font-mono mb-4">
          {lesson.concept}
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">{lesson.title}</h1>

        {/* Explanation */}
        <div className="text-text leading-relaxed whitespace-pre-line mb-6">
          {lesson.explanation}
        </div>

        {/* Code block */}
        {lesson.codeExample && (
          <div className="bg-bg border border-border rounded-xl p-4 mb-6 overflow-x-auto">
            <pre className="font-mono text-sm text-text whitespace-pre">
              {lesson.codeExample}
            </pre>
          </div>
        )}

        {/* Key takeaway */}
        <div className="border-l-4 border-success pl-4 py-2 mb-6">
          <div className="font-mono text-[10px] text-success tracking-widest uppercase mb-1">
            Key Takeaway
          </div>
          <p className="text-text text-sm">{lesson.keyTakeaway}</p>
        </div>

        {/* Doc ref */}
        {lesson.docRef && (
          <a
            href={lesson.docRef}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-accent text-sm hover:text-white transition-colors mb-6"
          >
            Read the Docs &nearr;
          </a>
        )}
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => {
            startedRef.current = false
            setLessonReadId(null)
            refetch()
          }}
          className="text-muted hover:text-white text-sm transition-colors"
        >
          &orarr; New Lesson
        </button>

        {lesson.quiz && (
          <button
            onClick={() => navigate(`/quiz/${topicId}`, { state: { lesson } })}
            className="px-6 py-2 bg-accent text-white rounded-lg font-semibold hover:bg-accent-hover transition-colors"
          >
            Test Yourself &rarr;
          </button>
        )}
      </div>
    </div>
  )
}
