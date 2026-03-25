const express = require('express')
const router = express.Router()
const { getAllModels } = require('../services/nvidia')
const config = require('../config/env')

router.get('/', (req, res) => {
  res.json({
    success: true,
    platform: 'XAI Market',
    description: 'Agent-facing AI model marketplace on X Layer',
    payment: {
      protocol: 'x402',
      network: 'xlayer',
      currency: 'USDC',
      receivingWallet: config.wallet.address
    },
    models: getAllModels()
  })
})

module.exports = router
