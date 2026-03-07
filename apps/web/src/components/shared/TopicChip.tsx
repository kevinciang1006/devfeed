import { TOPICS } from '../../data/topics'

interface TopicChipProps {
  topicId: string
  size?: 'sm' | 'md'
}

export function TopicChip({ topicId, size = 'md' }: TopicChipProps) {
  const topic = TOPICS.find((t) => t.id === topicId)
  if (!topic) return null

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border bg-transparent ${sizeClasses}`}
      style={{ borderColor: topic.color, color: topic.color }}
    >
      <span>{topic.icon}</span>
      <span>{topic.label}</span>
    </span>
  )
}
