const express = require('express')
const router = express.Router()
const { getPlatformStats } = require('../db/postgres')
const config = require('../config/env')

router.get('/', async (req, res) => {
  try {
    const stats = await getPlatformStats()
    res.json({
      success: true,
      receivingWallet: config.wallet.address,
      network: 'X Layer Mainnet',
      stats: {
        totalQueries: stats.total_queries,
        totalRevenue: `$${parseFloat(stats.total_revenue || 0).toFixed(4)} USDT`,
        uniqueWallets: stats.unique_wallets,
        avgResponseTime: `${Math.round(stats.avg_response_time || 0)}ms`
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

module.exports = router
