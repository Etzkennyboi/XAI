const { Pool } = require('pg')
const config = require('../config/env')

const pool = new Pool({
  connectionString: config.database.url,
  ssl: { rejectUnauthorized: false }
})

async function logQuery({ walletAddress, model, amountPaid, tokensUsed, responseTimeMs, status, paymentMethod }) {
  const client = await pool.connect()
  try {
    // Log query
    await client.query(
      `INSERT INTO queries 
       (wallet_address, model, amount_paid, payment_method, tokens_used, response_time_ms, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [walletAddress, model, amountPaid, paymentMethod || 'api', tokensUsed, responseTimeMs, status]
    )

    // Upsert wallet stats
    await client.query(
      `INSERT INTO wallets (wallet_address, total_queries, total_spent, last_active)
       VALUES ($1, 1, $2, NOW())
       ON CONFLICT (wallet_address) DO UPDATE SET
         total_queries = wallets.total_queries + 1,
         total_spent = wallets.total_spent + $2,
         last_active = NOW()`,
      [walletAddress, amountPaid]
    )
  } finally {
    client.release()
  }
}

async function getWalletUsage(walletAddress) {
  const client = await pool.connect()
  try {
    const walletResult = await client.query(
      `SELECT * FROM wallets WHERE wallet_address = $1`,
      [walletAddress]
    )

    const queriesResult = await client.query(
      `SELECT * FROM queries 
       WHERE wallet_address = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [walletAddress]
    )

    return {
      walletAddress,
      stats: walletResult.rows[0] || {
        total_queries: 0,
        total_spent: 0
      },
      history: queriesResult.rows
    }
  } finally {
    client.release()
  }
}

async function getPlatformStats() {
  const client = await pool.connect()
  try {
    const result = await client.query(`
      SELECT 
        COUNT(*) as total_queries,
        SUM(amount_paid) as total_revenue,
        COUNT(DISTINCT wallet_address) as unique_wallets,
        AVG(response_time_ms) as avg_response_time
      FROM queries
      WHERE status = 'success'
    `)
    return result.rows[0]
  } finally {
    client.release()
  }
}

module.exports = { logQuery, getWalletUsage, getPlatformStats }
