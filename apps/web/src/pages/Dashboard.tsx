import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { StatCard } from '../components/shared/StatCard'
import { SectionLabel } from '../components/shared/SectionLabel'
import { LoadingPulse } from '../components/shared/LoadingPulse'
import { useProgress, useUserTopics } from '../hooks/useProgress'
import { useAppStore } from '../store/useAppStore'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function Dashboard() {
  const navigate = useNavigate()
  const user = useAppStore((s) => s.user)
  const { data: progress, isLoading: progressLoading } = useProgress()
  const { data: topicsData, isLoading: topicsLoading } = useUserTopics()

  if (progressLoading || topicsLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingPulse label="Loading" />
        </div>
      </AppLayout>
    )
  }

  const userTopics = topicsData?.userTopics || []

  return (
    <AppLayout>
      {/* Greeting */}
      <h1 className="text-2xl font-bold text-white mb-6">
        {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}.
      </h1>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard value={progress?.streak ?? 0} label="Streak" emoji={"\uD83D\uDD25"} />
        <StatCard value={progress?.totalLessons ?? 0} label="Lessons" />
        <StatCard value={`${progress?.accuracy ?? 0}%`} label="Accuracy" />
      </div>

      {/* Weekly activity */}
      {progress?.weeklyActivity && (
        <div className="mb-8">
          <SectionLabel>This Week</SectionLabel>
          <div className="flex items-end justify-between gap-2 mt-3 h-20 bg-surface border border-border rounded-xl p-4">
            {progress.weeklyActivity.map((day) => {
              const maxCount = Math.max(...progress.weeklyActivity.map((d) => d.count), 1)
              const height = day.count > 0 ? Math.max((day.count / maxCount) * 100, 10) : 4
              return (
                <div key={day.date} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className="w-full rounded-sm transition-all"
                    style={{
                      height: `${height}%`,
                      backgroundColor: day.count > 0 ? '#646CFF' : '#1a1a1a',
                    }}
                  />
                  <span className="font-mono text-[9px] text-muted">{day.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Your Topics */}
      <SectionLabel>Your Topics</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        {userTopics.map((ut) => (
          <div
            key={ut.id}
            className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between hover:border-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{ut.topic?.icon || ''}</span>
              <div>
                <div className="text-white font-semibold" style={{ color: ut.topic?.color }}>
                  {ut.topic?.name || 'Topic'}
                </div>
                <div className="font-mono text-[10px] text-muted">
                  {ut.progress?.lessonsCompleted || 0} lessons completed
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate(`/learn/${ut.topicId}`)}
              className="text-sm text-[#646CFF] hover:text-white transition-colors font-semibold"
            >
              Learn &rarr;
            </button>
          </div>
        ))}
      </div>

      {userTopics.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted mb-4">No topics selected yet</p>
          <button
            onClick={() => navigate('/onboarding')}
            className="px-6 py-2 bg-[#646CFF] text-white rounded-lg font-semibold"
          >
            Get Started
          </button>
        </div>
      )}
    </AppLayout>
  )
}
