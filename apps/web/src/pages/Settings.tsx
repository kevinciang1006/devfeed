import { useState } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { SectionLabel } from '../components/shared/SectionLabel'
import { useAppStore } from '../store/useAppStore'
import { useAuth } from '../hooks/useAuth'
import { useUserTopics } from '../hooks/useProgress'

export function Settings() {
  const { user, signOut } = useAuth()
  const { sessionMode, setSessionMode } = useAppStore()
  const { data: topicsData } = useUserTopics()
  const [dailyReminder, setDailyReminder] = useState(false)

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      {/* Your Topics */}
      <div className="mb-8">
        <SectionLabel>Your Topics</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
          {topicsData?.map((ut) => (
            <div
              key={ut.id}
              className="bg-surface border border-border rounded-xl p-3 flex items-center gap-2"
            >
              <span>{ut.topic?.icon || ''}</span>
              <div>
                <div className="text-white text-sm" style={{ color: ut.topic?.color }}>
                  {ut.topic?.name}
                </div>
                <div className="font-mono text-[9px] text-muted uppercase">
                  {ut.expertiseLevel}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Session Mode */}
      <div className="mb-8">
        <SectionLabel>Session Mode</SectionLabel>
        <div className="flex gap-3 mt-3">
          <button
            onClick={() => setSessionMode('FOCUSED')}
            className={`flex-1 p-4 rounded-xl border transition-colors ${
              sessionMode === 'FOCUSED'
                ? 'border-[#646CFF] bg-[#646CFF]/10'
                : 'border-border bg-surface hover:border-muted'
            }`}
          >
            <div className="text-white font-semibold text-sm">Focused</div>
            <div className="text-muted text-xs mt-1">1 deep lesson per session</div>
          </button>
          <button
            onClick={() => setSessionMode('SHALLOW')}
            className={`flex-1 p-4 rounded-xl border transition-colors ${
              sessionMode === 'SHALLOW'
                ? 'border-[#646CFF] bg-[#646CFF]/10'
                : 'border-border bg-surface hover:border-muted'
            }`}
          >
            <div className="text-white font-semibold text-sm">Shallow</div>
            <div className="text-muted text-xs mt-1">Quick overview per session</div>
          </button>
        </div>
      </div>

      {/* Daily Reminder */}
      <div className="mb-8">
        <SectionLabel>Daily Reminder</SectionLabel>
        <div className="mt-3 flex items-center justify-between bg-surface border border-border rounded-xl p-4">
          <span className="text-white text-sm">Enable daily reminder</span>
          <button
            onClick={() => setDailyReminder(!dailyReminder)}
            className={`w-10 h-6 rounded-full transition-colors relative ${
              dailyReminder ? 'bg-[#646CFF]' : 'bg-border'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                dailyReminder ? 'left-5' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Account */}
      <div>
        <SectionLabel>Account</SectionLabel>
        <div className="mt-3 bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-4 mb-4">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-12 h-12 rounded-full" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#646CFF] flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0) || '?'}
              </div>
            )}
            <div>
              <div className="text-white font-semibold">{user?.name || 'User'}</div>
              <div className="text-muted text-sm">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full py-2 border border-[#EF4444] text-[#EF4444] rounded-lg text-sm hover:bg-[#EF4444]/10 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
