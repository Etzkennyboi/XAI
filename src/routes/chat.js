const express = require('express')
const router = express.Router()
const { x402Gate } = require('../middleware/x402')
const { callModel } = require('../services/nvidia')
const { logQuery } = require('../db/postgres')

router.post('/', x402Gate, async (req, res) => {
  const { model, messages, max_tokens } = req.body
  const { walletAddress, amount } = req.payment

  try {
    console.log(`\n📨 Query from ${walletAddress}`)
    console.log(`Model: ${model} | Price: $${amount}`)

    const result = await callModel(model, messages, max_tokens)

    // Log to Railway PostgreSQL (Background/Non-blocking)
    logQuery({
      walletAddress,
      model,
      amountPaid: amount,
      tokensUsed: result.tokensUsed || 0,
      responseTimeMs: result.responseTimeMs || 0,
      status: 'success'
    }).catch(err => console.error('Background logQuery failed:', err.message))

    console.log(`✅ Done in ${result.responseTimeMs}ms — earned $${amount} from ${walletAddress}`)

    return res.json(result.data)

  } catch (error) {
    console.error('Query failed:', error.message)

    await logQuery({
      walletAddress,
      model,
      amountPaid: amount,
      tokensUsed: 0,
      responseTimeMs: 0,
      status: 'failed'
    }).catch(() => {})

    return res.status(500).json({
      error: 'Model query failed',
      message: error.message
    })
  }
})

module.exports = router
