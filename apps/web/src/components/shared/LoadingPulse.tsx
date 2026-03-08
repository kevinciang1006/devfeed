interface LoadingPulseProps {
  label?: string
}

export function LoadingPulse({ label }: LoadingPulseProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4">
      <div className="w-3 h-3 rounded-full bg-accent animate-pulse-dot" />
      {label && (
        <span className="font-mono text-[11px] text-muted tracking-widest uppercase">
          {label}
        </span>
      )}
    </div>
  )
}
