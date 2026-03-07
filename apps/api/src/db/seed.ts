import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import {
  categories, domains, topics, lessons, prerequisites, quizzes, quizQuestions
} from './schema'

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client)

async function seed() {
  console.log('Seeding database...')

  // ── Categories ──
  const [techCat] = await db.insert(categories).values({ name: 'Technology', icon: '💻', slug: 'technology', description: 'Software engineering and development' }).returning()
  const [bizCat] = await db.insert(categories).values({ name: 'Business', icon: '💼', slug: 'business', description: 'Business and entrepreneurship' }).returning()
  const [econCat] = await db.insert(categories).values({ name: 'Economics', icon: '📈', slug: 'economics', description: 'Economics and finance' }).returning()
  const [sciCat] = await db.insert(categories).values({ name: 'Science', icon: '🔬', slug: 'science', description: 'Scientific disciplines' }).returning()
  const [desCat] = await db.insert(categories).values({ name: 'Design', icon: '🎨', slug: 'design', description: 'Design and user experience' }).returning()

  console.log('Categories seeded')

  // ── Domains under Technology ──
  const [frontendDomain] = await db.insert(domains).values({ categoryId: techCat.id, name: 'Frontend Development', slug: 'frontend-development', description: 'Building user interfaces' }).returning()
  const [backendDomain] = await db.insert(domains).values({ categoryId: techCat.id, name: 'Backend Development', slug: 'backend-development', description: 'Server-side development' }).returning()
  const [mobileDomain] = await db.insert(domains).values({ categoryId: techCat.id, name: 'Mobile Development', slug: 'mobile-development', description: 'Mobile app development' }).returning()
  const [devopsDomain] = await db.insert(domains).values({ categoryId: techCat.id, name: 'DevOps & Infrastructure', slug: 'devops-infrastructure', description: 'Deployment and infrastructure' }).returning()

  console.log('Domains seeded')

  // ── Topics under Frontend Development ──
  const [reactTopic] = await db.insert(topics).values({ domainId: frontendDomain.id, name: 'React', icon: '⚛️', color: '#61DAFB', slug: 'react', description: 'A JavaScript library for building user interfaces' }).returning()
  await db.insert(topics).values({ domainId: frontendDomain.id, name: 'TypeScript', icon: '📘', color: '#3178C6', slug: 'typescript', description: 'Typed superset of JavaScript' })
  await db.insert(topics).values({ domainId: frontendDomain.id, name: 'Vite', icon: '⚡', color: '#646CFF', slug: 'vite', description: 'Next generation frontend tooling' })
  await db.insert(topics).values({ domainId: frontendDomain.id, name: 'TanStack Query', icon: '🔄', color: '#FF4154', slug: 'tanstack-query', description: 'Powerful data synchronization for React' })
  await db.insert(topics).values({ domainId: frontendDomain.id, name: 'shadcn/ui', icon: '🎨', color: '#a1a1aa', slug: 'shadcn-ui', description: 'Beautifully designed components' })
  await db.insert(topics).values({ domainId: frontendDomain.id, name: 'CSS', icon: '🎨', color: '#264DE4', slug: 'css', description: 'Cascading Style Sheets' })
  await db.insert(topics).values({ domainId: frontendDomain.id, name: 'JavaScript', icon: '🟨', color: '#F7DF1E', slug: 'javascript', description: 'The language of the web' })

  // ── Topics under Backend Development ──
  await db.insert(topics).values({ domainId: backendDomain.id, name: 'Node.js', icon: '🟢', color: '#339933', slug: 'nodejs', description: 'JavaScript runtime built on V8' })
  await db.insert(topics).values({ domainId: backendDomain.id, name: 'Prisma', icon: '◭', color: '#5A67D8', slug: 'prisma', description: 'Next-generation ORM for Node.js' })
  await db.insert(topics).values({ domainId: backendDomain.id, name: 'PostgreSQL', icon: '🐘', color: '#336791', slug: 'postgresql', description: 'Advanced open source relational database' })
  await db.insert(topics).values({ domainId: backendDomain.id, name: 'REST APIs', icon: '🔌', color: '#00C853', slug: 'rest-apis', description: 'RESTful API design and implementation' })

  console.log('Topics seeded')

  // ── React Lessons (6 lessons) ──
  const [lesson1] = await db.insert(lessons).values({
    topicId: reactTopic.id,
    title: 'Components and Props',
    concept: 'Components & Props',
    explanation: 'React components are the building blocks of any React application. A component is a reusable piece of UI that can accept inputs called props (short for properties) and returns React elements describing what should appear on the screen.\n\nComponents can be written as functions that accept a props object and return JSX. Props flow downward from parent to child components, creating a unidirectional data flow. This means a parent component passes data to its children, but children cannot directly modify the props they receive.\n\nProps are read-only — a component must never modify its own props. This rule ensures predictable behavior and makes components easier to reason about. If a component needs to change its output over time, it should use state instead of modifying props.',
    codeExample: 'function Greeting({ name, role }) {\n  return (\n    <div>\n      <h1>Hello, {name}!</h1>\n      <p>Role: {role}</p>\n    </div>\n  );\n}\n\n// Usage:\n<Greeting name="Alice" role="Developer" />',
    keyTakeaway: 'Components are reusable UI building blocks, and props flow one-way from parent to child — never modify props directly.',
    difficulty: 'BEGINNER',
    order: 1,
    docRef: 'https://react.dev/learn/passing-props-to-a-component',
    isActive: true,
    source: 'PREGENERATED',
  }).returning()

  const [lesson2] = await db.insert(lessons).values({
    topicId: reactTopic.id,
    title: 'State with useState',
    concept: 'useState Hook',
    explanation: 'State lets a component "remember" information between renders. The useState hook is React\'s way of adding state to functional components. When you call useState, you get back a pair: the current state value and a function to update it.\n\nWhen you call the setter function, React schedules a re-render of the component with the new state value. State updates may be batched for performance, so the state value you read may not reflect the latest update immediately. Use the functional form of setState (prev => prev + 1) when the next state depends on the previous state.\n\nUnlike props, state is private to the component that declares it. Each instance of a component maintains its own independent state. State should be used for data that changes over time and affects the rendered output.',
    codeExample: 'import { useState } from "react";\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(prev => prev + 1)}>\n        Increment\n      </button>\n    </div>\n  );\n}',
    keyTakeaway: 'useState gives components memory — state persists across re-renders and updating it triggers a new render cycle.',
    difficulty: 'BEGINNER',
    order: 2,
    docRef: 'https://react.dev/reference/react/useState',
    isActive: true,
    source: 'PREGENERATED',
  }).returning()

  const [lesson3] = await db.insert(lessons).values({
    topicId: reactTopic.id,
    title: 'useEffect and the Dependency Array',
    concept: 'useEffect Hook',
    explanation: 'useEffect lets you synchronize a component with an external system. It runs side effects after the component renders. The dependency array tells React when to re-run the effect: an empty array means "run once after mount," no array means "run after every render," and a list of values means "re-run when any of these change."\n\nA common mistake is forgetting to include all dependencies used inside the effect. React relies on the dependency array to optimize when effects re-run. Missing dependencies can lead to stale closures where the effect uses outdated values.\n\nuseEffect can return a cleanup function that runs before the component unmounts or before the effect re-runs. This is essential for preventing memory leaks when subscribing to events, setting up intervals, or making async requests.',
    codeExample: 'import { useState, useEffect } from "react";\n\nfunction UserProfile({ userId }) {\n  const [user, setUser] = useState(null);\n\n  useEffect(() => {\n    let cancelled = false;\n\n    fetch(`/api/users/${userId}`)\n      .then(res => res.json())\n      .then(data => {\n        if (!cancelled) setUser(data);\n      });\n\n    return () => { cancelled = true; };\n  }, [userId]);\n\n  if (!user) return <p>Loading...</p>;\n  return <p>{user.name}</p>;\n}',
    keyTakeaway: 'useEffect synchronizes your component with external systems — always specify dependencies and clean up subscriptions.',
    difficulty: 'BEGINNER',
    order: 3,
    docRef: 'https://react.dev/reference/react/useEffect',
    isActive: true,
    source: 'PREGENERATED',
  }).returning()

  const [lesson4] = await db.insert(lessons).values({
    topicId: reactTopic.id,
    title: 'useCallback and Referential Equality',
    concept: 'useCallback Hook',
    explanation: 'useCallback is a hook that memoizes a callback function. In JavaScript, functions are objects, and a new function object is created every render even if the code is identical. This means passing a callback to a child component causes that child to re-render every time the parent renders, even if the callback logic hasn\'t changed.\n\nuseCallback solves this by returning a memoized version of the callback that only changes if its dependencies change. This is particularly useful when passing callbacks to optimized child components that rely on reference equality to avoid unnecessary renders (e.g., components wrapped in React.memo).\n\nDon\'t overuse useCallback — it has its own cost (storing the memoized function and comparing dependencies). Only use it when you\'re passing callbacks to child components that are expensive to re-render, or when a callback is used in a dependency array of useEffect or useMemo.',
    codeExample: 'import { useState, useCallback, memo } from "react";\n\nconst ExpensiveList = memo(({ items, onItemClick }) => {\n  console.log("ExpensiveList rendered");\n  return items.map(item => (\n    <div key={item.id} onClick={() => onItemClick(item.id)}>\n      {item.name}\n    </div>\n  ));\n});\n\nfunction Parent() {\n  const [items] = useState([{ id: 1, name: "Item 1" }]);\n  const [count, setCount] = useState(0);\n\n  const handleClick = useCallback((id) => {\n    console.log("Clicked:", id);\n  }, []);\n\n  return (\n    <div>\n      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>\n      <ExpensiveList items={items} onItemClick={handleClick} />\n    </div>\n  );\n}',
    keyTakeaway: 'useCallback memoizes functions to maintain referential equality — use it when passing callbacks to memoized child components.',
    difficulty: 'INTERMEDIATE',
    order: 4,
    docRef: 'https://react.dev/reference/react/useCallback',
    isActive: true,
    source: 'PREGENERATED',
  }).returning()

  const [lesson5] = await db.insert(lessons).values({
    topicId: reactTopic.id,
    title: 'useMemo and Expensive Computations',
    concept: 'useMemo Hook',
    explanation: 'useMemo is a hook that memoizes the result of a computation. It recalculates the value only when one of its dependencies changes. This is useful for expensive calculations that would slow down every render if recalculated each time.\n\nLike useCallback (which is actually syntactic sugar for useMemo returning a function), useMemo compares dependencies by reference. It\'s designed for computations that are genuinely expensive — filtering or sorting large lists, complex mathematical operations, or creating derived data structures.\n\nDon\'t reach for useMemo as a default optimization. React is fast, and most computations complete quickly. Profile first, then optimize. Premature memoization adds complexity without measurable benefit. Use useMemo when you can demonstrate that a computation is a bottleneck.',
    codeExample: 'import { useState, useMemo } from "react";\n\nfunction FilteredList({ items, searchTerm }) {\n  const filteredItems = useMemo(() => {\n    console.log("Filtering...");\n    return items.filter(item =>\n      item.name.toLowerCase().includes(searchTerm.toLowerCase())\n    );\n  }, [items, searchTerm]);\n\n  return (\n    <ul>\n      {filteredItems.map(item => (\n        <li key={item.id}>{item.name}</li>\n      ))}\n    </ul>\n  );\n}',
    keyTakeaway: 'useMemo caches expensive computation results — only use it when profiling shows a real performance bottleneck.',
    difficulty: 'INTERMEDIATE',
    order: 5,
    docRef: 'https://react.dev/reference/react/useMemo',
    isActive: true,
    source: 'PREGENERATED',
  }).returning()

  const [lesson6] = await db.insert(lessons).values({
    topicId: reactTopic.id,
    title: 'React Reconciliation',
    concept: 'Reconciliation Algorithm',
    explanation: 'React\'s reconciliation algorithm is how React updates the DOM efficiently. When state or props change, React creates a new virtual DOM tree and compares it with the previous one (a process called "diffing"). It then calculates the minimum number of DOM operations needed to bring the actual DOM in sync.\n\nReact uses two key heuristics: elements of different types produce different trees (and are replaced entirely), and the developer can hint at which child elements remain stable across renders using the key prop. Without keys, React matches children by index, which can lead to bugs and poor performance when list items are reordered.\n\nThe key prop is critical for lists. React uses keys to match children in the old tree with children in the new tree. Keys should be stable, predictable, and unique among siblings. Never use array indices as keys for dynamic lists — this defeats the purpose of keys and can cause subtle state bugs.',
    codeExample: '// BAD: Using index as key\n{items.map((item, index) => (\n  <TodoItem key={index} item={item} />\n))}\n\n// GOOD: Using stable unique ID\n{items.map(item => (\n  <TodoItem key={item.id} item={item} />\n))}\n\n// Why it matters: When items reorder, index keys\n// cause React to update ALL items instead of\n// just moving DOM nodes. Stable keys let React\n// correctly identify which items moved.',
    keyTakeaway: 'React\'s reconciliation diffs virtual DOM trees efficiently — use stable, unique keys on list items to help React minimize DOM updates.',
    difficulty: 'ADVANCED',
    order: 6,
    docRef: 'https://react.dev/learn/preserving-and-resetting-state',
    isActive: true,
    source: 'PREGENERATED',
  }).returning()

  console.log('Lessons seeded')

  // ── Prerequisites ──
  await db.insert(prerequisites).values({ lessonId: lesson4.id, requiresId: lesson2.id }) // useCallback requires useState
  await db.insert(prerequisites).values({ lessonId: lesson5.id, requiresId: lesson4.id }) // useMemo requires useCallback
  await db.insert(prerequisites).values({ lessonId: lesson6.id, requiresId: lesson3.id }) // Reconciliation requires useEffect

  console.log('Prerequisites seeded')

  // ── Quizzes ──
  // Quiz for Lesson 1: Components and Props
  const [quiz1] = await db.insert(quizzes).values({ lessonId: lesson1.id }).returning()
  await db.insert(quizQuestions).values([
    { quizId: quiz1.id, question: 'What is the primary purpose of props in React?', options: ['To pass data from parent to child components', 'To store mutable data within a component', 'To handle user events', 'To manage component lifecycle'], correctIndex: 0, explanation: 'Props (properties) are the mechanism for passing data from a parent component down to its child components in a unidirectional flow.', order: 1 },
    { quizId: quiz1.id, question: 'Can a component modify its own props?', options: ['Yes, using this.props = newValue', 'Yes, but only in class components', 'No, props are read-only', 'Yes, using the useState hook'], correctIndex: 2, explanation: 'Props are read-only. A component must never modify its own props. This ensures predictable behavior and unidirectional data flow.', order: 2 },
    { quizId: quiz1.id, question: 'Which direction do props flow in React?', options: ['Child to parent', 'Parent to child (unidirectional)', 'Both directions (bidirectional)', 'Between sibling components'], correctIndex: 1, explanation: 'Props flow unidirectionally from parent to child. This one-way data flow makes React applications easier to understand and debug.', order: 3 },
  ])

  // Quiz for Lesson 2: useState
  const [quiz2] = await db.insert(quizzes).values({ lessonId: lesson2.id }).returning()
  await db.insert(quizQuestions).values([
    { quizId: quiz2.id, question: 'What does useState return?', options: ['A single state value', 'An object with state and setState', 'An array with the current value and a setter function', 'A promise that resolves to the state'], correctIndex: 2, explanation: 'useState returns an array with exactly two elements: the current state value and a function to update it, typically destructured as [value, setValue].', order: 1 },
    { quizId: quiz2.id, question: 'When should you use the functional form of setState (e.g., setCount(prev => prev + 1))?', options: ['Always, as a best practice', 'When the next state depends on the previous state', 'Only for number values', 'Only inside useEffect'], correctIndex: 1, explanation: 'The functional form ensures you work with the latest state value, which is important when state updates may be batched or when updating from closures.', order: 2 },
    { quizId: quiz2.id, question: 'Is state shared between multiple instances of the same component?', options: ['Yes, all instances share the same state', 'Yes, but only if they have the same key', 'No, each component instance has its own state', 'Only if using context'], correctIndex: 2, explanation: 'State is private to each component instance. Two <Counter /> components on the same page maintain completely independent state.', order: 3 },
  ])

  // Quiz for Lesson 3: useEffect
  const [quiz3] = await db.insert(quizzes).values({ lessonId: lesson3.id }).returning()
  await db.insert(quizQuestions).values([
    { quizId: quiz3.id, question: 'What does an empty dependency array ([]) in useEffect mean?', options: ['Run the effect on every render', 'Run the effect only once after the initial mount', 'Never run the effect', 'Run the effect only when props change'], correctIndex: 1, explanation: 'An empty dependency array tells React there are no dependencies to track, so the effect only runs once after the initial render (mount).', order: 1 },
    { quizId: quiz3.id, question: 'What is the cleanup function in useEffect used for?', options: ['To reset state to initial values', 'To prevent memory leaks by cleaning up subscriptions or timers', 'To handle errors in the effect', 'To batch multiple state updates'], correctIndex: 1, explanation: 'The cleanup function runs before the component unmounts or before the effect re-runs, preventing memory leaks from subscriptions, event listeners, or timers.', order: 2 },
    { quizId: quiz3.id, question: 'What happens if you omit a dependency from the dependency array?', options: ['React throws an error', 'The effect may use stale (outdated) values', 'The component won\'t render', 'Nothing, React auto-detects dependencies'], correctIndex: 1, explanation: 'Missing dependencies cause the effect to close over stale values from a previous render, leading to bugs that are hard to track down.', order: 3 },
  ])

  // Quiz for Lesson 4: useCallback
  const [quiz4] = await db.insert(quizzes).values({ lessonId: lesson4.id }).returning()
  await db.insert(quizQuestions).values([
    { quizId: quiz4.id, question: 'Why does passing a new function to a child component cause re-renders?', options: ['Functions are primitive values', 'React always re-renders children', 'A new function object is created each render, failing reference equality', 'JavaScript does not support function comparison'], correctIndex: 2, explanation: 'In JavaScript, functions are objects. A new function created each render is a different reference, so React.memo sees it as a changed prop.', order: 1 },
    { quizId: quiz4.id, question: 'When is useCallback most beneficial?', options: ['For every callback function in your app', 'When passing callbacks to memoized child components', 'Only for async functions', 'When you need to call a function multiple times'], correctIndex: 1, explanation: 'useCallback is most useful when passing callbacks to child components wrapped in React.memo, preventing unnecessary re-renders.', order: 2 },
    { quizId: quiz4.id, question: 'What determines when a useCallback-memoized function updates?', options: ['A timer', 'The component\'s render count', 'Changes in its dependency array values', 'When the component unmounts'], correctIndex: 2, explanation: 'useCallback returns the same function reference as long as its dependencies haven\'t changed, only creating a new reference when dependencies update.', order: 3 },
  ])

  // Quiz for Lesson 5: useMemo
  const [quiz5] = await db.insert(quizzes).values({ lessonId: lesson5.id }).returning()
  await db.insert(quizQuestions).values([
    { quizId: quiz5.id, question: 'What does useMemo memoize?', options: ['A callback function', 'The result of a computation', 'A component', 'A DOM element'], correctIndex: 1, explanation: 'useMemo memoizes the return value of a computation, recalculating only when dependencies change.', order: 1 },
    { quizId: quiz5.id, question: 'Should you use useMemo for every computation?', options: ['Yes, always optimize', 'No, only for genuinely expensive computations proven by profiling', 'Yes, but only for object values', 'No, never use it'], correctIndex: 1, explanation: 'Premature memoization adds complexity. Profile first to identify real bottlenecks before adding useMemo.', order: 2 },
    { quizId: quiz5.id, question: 'How is useMemo related to useCallback?', options: ['They are completely unrelated', 'useCallback is syntactic sugar for useMemo returning a function', 'useMemo is built on top of useCallback', 'useCallback is deprecated in favor of useMemo'], correctIndex: 1, explanation: 'useCallback(fn, deps) is equivalent to useMemo(() => fn, deps). Both memoize values, but useCallback is specialized for functions.', order: 3 },
  ])

  // Quiz for Lesson 6: Reconciliation
  const [quiz6] = await db.insert(quizzes).values({ lessonId: lesson6.id }).returning()
  await db.insert(quizQuestions).values([
    { quizId: quiz6.id, question: 'What is React reconciliation?', options: ['A state management pattern', 'The process of comparing virtual DOM trees and updating the real DOM', 'A way to handle errors', 'A method for code splitting'], correctIndex: 1, explanation: 'Reconciliation is React\'s algorithm for diffing the new virtual DOM tree with the previous one to calculate the minimum DOM updates needed.', order: 1 },
    { quizId: quiz6.id, question: 'Why should you avoid using array index as a key for dynamic lists?', options: ['It\'s a syntax error', 'It causes incorrect matching when items reorder, leading to bugs and poor performance', 'React doesn\'t support number keys', 'It makes the code harder to read'], correctIndex: 1, explanation: 'Index keys cause React to match elements incorrectly when items are added, removed, or reordered, leading to state bugs and unnecessary DOM updates.', order: 2 },
    { quizId: quiz6.id, question: 'What are the two heuristics React uses for diffing?', options: ['Depth-first and breadth-first search', 'Elements of different types produce different trees, and keys identify stable children', 'Props comparison and state comparison', 'Shallow and deep equality checks'], correctIndex: 1, explanation: 'React assumes different element types produce different trees (replaced entirely) and uses keys to match children across renders.', order: 3 },
  ])

  console.log('Quizzes seeded')
  console.log('Seed complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
