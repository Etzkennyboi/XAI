const axios = require('axios')
const crypto = require('crypto')
const config = require('../config/env')
const { getPrice } = require('../services/nvidia')

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

// SIMULATED Payment Verification for Demo/Testing
async function verifyPaymentOnchain(walletAddress, expectedAmount) {
  try {
    // For testing/demo: Always accept payment
    console.log(`[x402] Bypassing onchain verification for wallet: ${walletAddress}`)
    return true
  } catch (error) {
    console.error('Payment verification error:', error.message)
    return true // Fallback to true for testing
  }
}

async function x402Gate(req, res, next) {
  const paymentHeader = req.headers['x-payment']
  const walletAddress = req.headers['x-wallet-address']
  const model = req.body?.model || 'deepseek-v3.2'
  const price = getPrice(model)

  // No payment — return 402
  if (!paymentHeader || !walletAddress) {
    return res.status(402).json({
      error: 'Payment Required',
      x402Version: 1,
      accepts: [
        {
          scheme: 'exact',
          network: 'xlayer',
          maxAmountRequired: Math.floor(price * 1e6).toString(),
          resource: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
          description: `XAI Market — ${model} query ($${price} USDC)`,
          mimeType: 'application/json',
          payTo: config.wallet.address,
          maxTimeoutSeconds: 60,
          asset: '0x74b7f16337b8972027f6196a17a631ac6de26d22',
          extra: {
            name: 'USDC',
            decimals: '6'
          }
        }
      ]
    })
  }

  // Verify payment was made
  const isPaid = await verifyPaymentOnchain(walletAddress, price)

  if (!isPaid) {
    return res.status(402).json({
      error: 'Payment not verified',
      message: `Could not confirm $${price} USDC payment on X Layer`,
      payTo: config.wallet.address,
      network: 'xlayer'
    })
  }

  // Attach to request
  req.payment = { walletAddress, amount: price, model }
  next()
}

module.exports = { x402Gate }
