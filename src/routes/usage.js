const express = require('express')
const router = express.Router()
const { getWalletUsage } = require('../db/postgres')

router.get('/:walletAddress', async (req, res) => {
  try {
    const usage = await getWalletUsage(req.params.walletAddress)
    res.json({ success: true, usage })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

module.exports = router
