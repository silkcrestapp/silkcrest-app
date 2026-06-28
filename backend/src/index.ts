import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import invitesRouter from './routes/invites'
import registerRouter from './routes/register'

const app = express()
const PORT = process.env.PORT ?? 3001

// --- Middleware ---
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

// --- Routes ---
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/invites', invitesRouter)
app.use('/register', registerRouter)

// --- Start ---
app.listen(PORT, () => {
  console.log(`Silkcrest API running on port ${PORT}`)
})

export default app