import { AppLayout } from '../components/layout/AppLayout'
import { StatCard } from '../components/shared/StatCard'
import { SectionLabel } from '../components/shared/SectionLabel'
import { LoadingPulse } from '../components/shared/LoadingPulse'
import { useProgress } from '../hooks/useProgress'
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer,
  BarChart, Bar, Tooltip, Cell
} from 'recharts'

export function Progress() {
  const { data: progress, isLoading } = useProgress()

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingPulse label="Loading" />
        </div>
      </AppLayout>
    )
  }

  if (!progress) return null

  // Accuracy chart data (using weekly activity as proxy since we don't have daily accuracy)
  const accuracyData = progress.weeklyActivity.map((d) => ({
    name: d.label,
    accuracy: d.count > 0 ? progress.accuracy : 0,
  }))

  // Lessons per topic bar chart
  const topicBarData = progress.topicBreakdown.map((t) => ({
    name: t.topicName,
    lessons: t.lessonsCompleted,
    color: t.topicColor,
  }))

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold text-white mb-6">Progress</h1>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard value={progress.streak} label="Streak" emoji={"\uD83D\uDD25"} />
        <StatCard value={progress.totalLessons} label="Lessons" />
        <StatCard value={`${progress.accuracy}%`} label="Accuracy" />
      </div>

      {/* Accuracy chart */}
      <div className="mb-8">
        <SectionLabel>Accuracy Trend</SectionLabel>
        <div className="bg-surface border border-border rounded-xl p-4 mt-3 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={accuracyData}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Line type="monotone" dataKey="accuracy" stroke="#646CFF" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lessons per topic */}
      {topicBarData.length > 0 && (
        <div className="mb-8">
          <SectionLabel>Lessons per Topic</SectionLabel>
          <div className="bg-surface border border-border rounded-xl p-4 mt-3 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicBarData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip
                  contentStyle={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 8 }}
                  labelStyle={{ color: '#e0e0e0' }}
                />
                <Bar dataKey="lessons" radius={[0, 4, 4, 0]}>
                  {topicBarData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent sessions */}
      {progress.recentSessions.length > 0 && (
        <div>
          <SectionLabel>Recent Sessions</SectionLabel>
          <div className="flex flex-col gap-2 mt-3">
            {progress.recentSessions.map((session) => (
              <div
                key={session.id}
                className="bg-surface border border-border rounded-xl p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{session.topic?.icon || ''}</span>
                  <div>
                    <div className="text-white text-sm">{session.lessonTitle || 'Session'}</div>
                    <div className="text-muted text-[10px] font-mono">
                      {new Date(session.completedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {session.quizScore !== undefined && (
                  <span className="font-mono text-xs text-[#646CFF]">
                    {session.quizScore}/{session.quizTotal}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  )
}
