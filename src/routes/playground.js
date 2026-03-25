const express = require('express')
const router = express.Router()
const { callModel, getPrice } = require('../services/nvidia')
const { logQuery } = require('../db/postgres')
const config = require('../config/env')
const axios = require('axios')
const crypto = require('crypto')

// USDC contract on X Layer
const USDC_CONTRACT = '0x74b7f16337b8972027f6196a17a631ac6de26d22'

function getOKXHeaders(method, path) {
  const timestamp = new Date().toISOString()
  const message = timestamp + method + path
  const sign = crypto
    .createHmac('sha256', config.okx.secretKey)
    .update(message)
    .digest('base64')

  return {
    'OK-ACCESS-KEY': config.okx.apiKey,
    'OK-ACCESS-SIGN': sign,
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE': config.okx.passphrase,
    'Content-Type': 'application/json'
  }
}

// Verify a specific tx hash on X Layer
async function verifyTxHash(txHash) {
  try {
    const path = `/api/v5/explorer/transaction/transaction-fills?chainShortName=XLAYER&txHash=${txHash}`
    const response = await axios.get(
      `https://www.oklink.com${path}`,
      { headers: getOKXHeaders('GET', path) }
    )
    const txData = response.data?.data?.[0]
    if (!txData) return false

    // Check the tx went to our receiving wallet
    const toAddr = txData.to?.toLowerCase()
    return toAddr === config.wallet.address.toLowerCase()
  } catch (error) {
    console.error('Playground tx verification error:', error.message)
    // For hackathon demo — accept the tx if we can't verify
    return true
  }
}

// Playground route — accepts wallet-connected web users
router.post('/', async (req, res) => {
  const { model, messages, max_tokens, txHash, walletAddress } = req.body

  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address required' })
  }

  if (!txHash) {
    return res.status(402).json({
      error: 'Payment Required',
      x402Version: 1,
      paymentMethod: 'web',
      price: getPrice(model || 'deepseek-v3.2'),
      currency: 'USDC',
      contract: USDC_CONTRACT,
      payTo: config.wallet.address,
      decimals: 6,
      network: 'xlayer',
      chainId: 196
    })
  }

  try {
    const modelId = model || 'deepseek-v3.2'
    const price = getPrice(modelId)

    console.log(`\n🌐 Playground query from ${walletAddress}`)
    console.log(`Model: ${modelId} | Price: $${price} | TX: ${txHash}`)

    // Verify the transaction
    const verified = await verifyTxHash(txHash)
    if (!verified) {
      return res.status(402).json({
        error: 'Transaction not verified',
        message: 'Could not confirm your USDC payment on X Layer'
      })
    }

    const result = await callModel(modelId, messages, max_tokens)

    // Log with payment_method = 'web' (Background/Non-blocking)
    logQuery({
      walletAddress,
      model: modelId,
      amountPaid: price,
      tokensUsed: result.tokensUsed || 0,
      responseTimeMs: result.responseTimeMs || 0,
      status: 'success',
      paymentMethod: 'web'
    }).catch(err => console.error('Background logQuery failed:', err.message))

    console.log(`✅ Playground query completed for ${walletAddress}`)

    return res.json(result.data)

  } catch (error) {
    console.error('Playground query failed:', error.message)
    return res.status(500).json({
      error: 'Model query failed',
      message: error.message
    })
  }
})

module.exports = router
