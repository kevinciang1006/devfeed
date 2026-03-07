import { AppRouter } from './router'
import { useAuth } from './hooks/useAuth'

export default function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-3 h-3 rounded-full bg-[#646CFF] animate-pulse-dot" />
      </div>
    )
  }

  return <AppRouter />
}
