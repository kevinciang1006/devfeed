import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { Login } from '../pages/Login'
import { Onboarding } from '../pages/Onboarding'
import { Dashboard } from '../pages/Dashboard'
import { Learn } from '../pages/Learn'
import { Quiz } from '../pages/Quiz'
import { Progress } from '../pages/Progress'
import { Settings } from '../pages/Settings'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAppStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  // In a full implementation, we'd check if the user has topics
  // For now, just render children
  return <>{children}</>
}

export function AppRouter() {
  const user = useAppStore((s) => s.user)

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/onboarding" element={
        <ProtectedRoute><Onboarding /></ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute><OnboardingGuard><Dashboard /></OnboardingGuard></ProtectedRoute>
      } />
      <Route path="/learn/:topicId" element={
        <ProtectedRoute><Learn /></ProtectedRoute>
      } />
      <Route path="/quiz/:topicId" element={
        <ProtectedRoute><Quiz /></ProtectedRoute>
      } />
      <Route path="/progress" element={
        <ProtectedRoute><Progress /></ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute><Settings /></ProtectedRoute>
      } />
    </Routes>
  )
}
