interface DifficultyBadgeProps {
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
}

const colors: Record<string, string> = {
  BEGINNER: '#22C55E',
  INTERMEDIATE: '#F59E0B',
  ADVANCED: '#EF4444',
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const color = colors[difficulty] || '#666'

  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-wider uppercase bg-transparent"
      style={{ borderColor: color, color }}
    >
      {difficulty}
    </span>
  )
}
