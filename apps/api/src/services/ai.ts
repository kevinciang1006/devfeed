import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface LessonData {
  title: string
  concept: string
  explanation: string
  codeExample: string | null
  keyTakeaway: string
  difficulty: string
  docRef: string | null
}

interface QuizData {
  questions: {
    question: string
    options: string[]
    correctIndex: number
    explanation: string
  }[]
}

function parseJSON<T>(text: string): T {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try {
    return JSON.parse(cleaned) as T
  } catch (e) {
    throw new Error(`Failed to parse AI response as JSON: ${(e as Error).message}`)
  }
}

export async function generateLesson(
  topicName: string,
  difficulty: string,
  previousConcepts: string[]
): Promise<LessonData> {
  const previousStr = previousConcepts.length > 0
    ? `The student has already learned: ${previousConcepts.join(', ')}. Do NOT repeat these concepts.`
    : 'This is the student\'s first lesson on this topic.'

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 2000,
    system: 'You are a factual programming educator. Ground all content in official documentation. Respond ONLY with valid JSON, no markdown fences or extra text.',
    messages: [{
      role: 'user',
      content: `Generate a ${difficulty} level lesson about ${topicName}.

${previousStr}

Respond with this exact JSON structure:
{
  "title": "Lesson title",
  "concept": "Core concept name (2-4 words)",
  "explanation": "Clear, detailed explanation (3-5 paragraphs)",
  "codeExample": "Practical code example or null",
  "keyTakeaway": "One-sentence key takeaway",
  "difficulty": "${difficulty}",
  "docRef": "URL to official documentation or null"
}`
    }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return parseJSON<LessonData>(text)
}

export async function generateQuiz(lesson: {
  title: string
  concept: string
  explanation: string
  codeExample: string | null
}): Promise<QuizData> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1500,
    system: 'You are a quiz generator. Create questions that test understanding, not memorization. Respond ONLY with valid JSON, no markdown fences or extra text.',
    messages: [{
      role: 'user',
      content: `Generate 3 quiz questions for this lesson:

Title: ${lesson.title}
Concept: ${lesson.concept}
Explanation: ${lesson.explanation}
${lesson.codeExample ? `Code Example: ${lesson.codeExample}` : ''}

Respond with this exact JSON structure:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this answer is correct"
    }
  ]
}

Generate exactly 3 questions. Each must have exactly 4 options. correctIndex is 0-3.`
    }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return parseJSON<QuizData>(text)
}
