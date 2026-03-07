interface StatCardProps {
  value: string | number
  label: string
  emoji?: string
}

export function StatCard({ value, label, emoji }: StatCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col items-center justify-center gap-1">
      <div className="font-mono font-black text-white text-2xl">
        {emoji && <span className="mr-1">{emoji}</span>}
        {value}
      </div>
      <div className="font-mono text-[9px] text-muted tracking-widest uppercase">
        {label}
      </div>
    </div>
  )
}
