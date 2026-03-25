const express = require('express')
const cors = require('cors')
const path = require('path')
const config = require('./config/env')

const chatRoutes = require('./routes/chat')
const modelRoutes = require('./routes/models')
const usageRoutes = require('./routes/usage')
const balanceRoutes = require('./routes/balance')
const playgroundRoutes = require('./routes/playground')

const app = express()
app.use(cors())
app.use(express.json())

// Serve static frontend
app.use(express.static(path.join(__dirname, '..', 'public')))

app.use('/api/chat', chatRoutes)
app.use('/api/models', modelRoutes)
app.use('/api/usage', usageRoutes)
app.use('/api/balance', balanceRoutes)
app.use('/api/chat/playground', playgroundRoutes)

// API info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'XAI Market',
    version: '2.0.0',
    tagline: 'The API marketplace where agents pay agents',
    receivingWallet: config.wallet.address,
    endpoints: {
      models: 'GET /api/models',
      chat: 'POST /api/chat',
      usage: 'GET /api/usage/:wallet',
      balance: 'GET /api/balance'
    },
    payment: {
      protocol: 'x402',
      network: 'X Layer Mainnet',
      currency: 'USDC'
    }
  })
})

// Serve frontend for all non-API routes
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'))
})

app.listen(config.port, () => {
  console.log(`\nXAI Market running on port ${config.port}`)
  console.log(`Receiving wallet: ${config.wallet.address}`)
  console.log(`Models loaded: 6`)
  console.log(`Database: Railway PostgreSQL`)
})
