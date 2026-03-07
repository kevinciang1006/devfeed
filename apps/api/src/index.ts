import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import { errorHandler } from './middleware/errorHandler'
import authRoutes from './routes/auth'
import topicsRoutes from './routes/topics'
import lessonsRoutes from './routes/lessons'
import quizRoutes from './routes/quiz'
import progressRoutes from './routes/progress'
import sessionsRoutes from './routes/sessions'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors({ origin: process.env.VITE_API_URL || 'http://localhost:5173' }))
app.use(morgan('dev'))
app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/topics', topicsRoutes)
app.use('/api/lessons', lessonsRoutes)
app.use('/api/quiz', quizRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/sessions', sessionsRoutes)

// Error handler
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`DevFeed API running on port ${PORT}`)
})
