interface SectionLabelProps {
  children: React.ReactNode
}

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <div className="font-mono text-[10px] text-muted tracking-widest uppercase">
      {children}
    </div>
  )
}
