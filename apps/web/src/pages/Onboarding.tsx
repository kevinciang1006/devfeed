import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getAllTopics } from '../lib/api'
import { useSaveTopics } from '../hooks/useProgress'
import type { ExpertiseLevel } from '@devfeed/shared'

interface TopicSelection {
  topicId: string
  expertiseLevel: ExpertiseLevel
  yearsExp?: number
}

export function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)
  const [selectedTopics, setSelectedTopics] = useState<TopicSelection[]>([])
  const [extraCategories, setExtraCategories] = useState<string[]>([])

  const { data } = useQuery({ queryKey: ['allTopics'], queryFn: getAllTopics })
  const saveTopics = useSaveTopics()

  const categories = data?.categories || []
  const filteredDomains = categories.find((c) => c.id === selectedCategory)?.domains || []
  const filteredTopics = filteredDomains.find((d) => d.id === selectedDomain)?.topics || []

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) => {
      const existing = prev.find((t) => t.topicId === topicId)
      if (existing) return prev.filter((t) => t.topicId !== topicId)
      return [...prev, { topicId, expertiseLevel: 'BEGINNER' as ExpertiseLevel }]
    })
  }

  const setTopicLevel = (topicId: string, level: ExpertiseLevel) => {
    setSelectedTopics((prev) =>
      prev.map((t) => (t.topicId === topicId ? { ...t, expertiseLevel: level } : t))
    )
  }

  const handleSave = async () => {
    if (selectedTopics.length === 0) return
    await saveTopics.mutateAsync({ topics: selectedTopics })
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`w-8 h-1 rounded-full ${s <= step ? 'bg-[#646CFF]' : 'bg-border'}`}
          />
        ))}
        <span className="ml-2 font-mono text-[10px] text-muted">{step}/4</span>
      </div>

      {/* Step 1: Category */}
      {step === 1 && (
        <div className="w-full">
          <h2 className="text-2xl font-bold text-white mb-2">What's your main focus?</h2>
          <p className="text-muted text-sm mb-6">Pick a category to get started</p>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`p-4 rounded-xl border text-left transition-colors ${
                  selectedCategory === cat.id
                    ? 'border-[#646CFF] bg-[#646CFF]/10'
                    : 'border-border bg-surface hover:border-muted'
                }`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <div className="text-white font-semibold mt-2">{cat.name}</div>
                {cat.description && (
                  <div className="text-muted text-xs mt-1">{cat.description}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Domain */}
      {step === 2 && (
        <div className="w-full">
          <h2 className="text-2xl font-bold text-white mb-2">What do you do?</h2>
          <p className="text-muted text-sm mb-6">Pick your domain</p>
          <div className="grid grid-cols-1 gap-3">
            {filteredDomains.map((domain) => (
              <button
                key={domain.id}
                onClick={() => setSelectedDomain(domain.id)}
                className={`p-4 rounded-xl border text-left transition-colors ${
                  selectedDomain === domain.id
                    ? 'border-[#646CFF] bg-[#646CFF]/10'
                    : 'border-border bg-surface hover:border-muted'
                }`}
              >
                <div className="text-white font-semibold">{domain.name}</div>
                {domain.description && (
                  <div className="text-muted text-xs mt-1">{domain.description}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Topics + expertise */}
      {step === 3 && (
        <div className="w-full">
          <h2 className="text-2xl font-bold text-white mb-2">Your stack</h2>
          <p className="text-muted text-sm mb-6">Pick topics and set your expertise level</p>
          <div className="flex flex-col gap-3">
            {filteredTopics.map((topic) => {
              const selected = selectedTopics.find((t) => t.topicId === topic.id)
              return (
                <div
                  key={topic.id}
                  className={`p-4 rounded-xl border transition-colors ${
                    selected ? 'border-[#646CFF] bg-[#646CFF]/10' : 'border-border bg-surface'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleTopic(topic.id)}
                      className="flex items-center gap-3"
                    >
                      <span className="text-xl">{topic.icon}</span>
                      <span className="text-white font-semibold" style={{ color: topic.color }}>
                        {topic.name}
                      </span>
                    </button>
                    {selected && (
                      <select
                        value={selected.expertiseLevel}
                        onChange={(e) => setTopicLevel(topic.id, e.target.value as ExpertiseLevel)}
                        className="bg-bg border border-border rounded px-2 py-1 text-xs text-white font-mono"
                      >
                        <option value="BEGINNER">Beginner</option>
                        <option value="INTERMEDIATE">Intermediate</option>
                        <option value="ADVANCED">Advanced</option>
                      </select>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Step 4: Extra interests */}
      {step === 4 && (
        <div className="w-full">
          <h2 className="text-2xl font-bold text-white mb-2">Any other interests?</h2>
          <p className="text-muted text-sm mb-6">Optional — you can skip this</p>
          <div className="grid grid-cols-2 gap-3">
            {categories
              .filter((c) => c.id !== selectedCategory)
              .map((cat) => (
                <button
                  key={cat.id}
                  onClick={() =>
                    setExtraCategories((prev) =>
                      prev.includes(cat.id) ? prev.filter((id) => id !== cat.id) : [...prev, cat.id]
                    )
                  }
                  className={`p-4 rounded-xl border text-left transition-colors ${
                    extraCategories.includes(cat.id)
                      ? 'border-[#646CFF] bg-[#646CFF]/10'
                      : 'border-border bg-surface hover:border-muted'
                  }`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <div className="text-white font-semibold mt-2">{cat.name}</div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center gap-4 mt-8 w-full">
        {step > 1 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="px-6 py-2 border border-border rounded-lg text-muted hover:text-white transition-colors"
          >
            Back
          </button>
        )}
        <div className="flex-1" />
        {step < 4 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={
              (step === 1 && !selectedCategory) ||
              (step === 2 && !selectedDomain) ||
              (step === 3 && selectedTopics.length === 0)
            }
            className="px-6 py-2 bg-[#646CFF] text-white rounded-lg font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#5558DD] transition-colors"
          >
            Next
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-[#646CFF] text-white rounded-lg font-semibold hover:bg-[#5558DD] transition-colors"
            >
              {saveTopics.isPending ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                handleSave()
              }}
              className="px-6 py-2 border border-border rounded-lg text-muted hover:text-white transition-colors"
            >
              Skip
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
