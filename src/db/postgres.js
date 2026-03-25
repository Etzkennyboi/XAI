const { Pool } = require('pg')
const config = require('../config/env')

const isUnconfigured = !config.database.url || config.database.url.includes('user:pass@host:port');

const pool = isUnconfigured ? null : new Pool({
  connectionString: config.database.url,
  ssl: { rejectUnauthorized: false }
})

if (isUnconfigured) {
  console.warn('⚠️  DATABASE_URL is not configured (using placeholders). Database features are disabled.');
}

async function logQuery({ walletAddress, model, amountPaid, tokensUsed, responseTimeMs, status, paymentMethod }) {
  if (!pool) return; // Silent skip if DB not configured
  
  try {
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
  } catch (err) {
    console.warn('Database logQuery failed (skipping):', err.message);
  }
}

async function getWalletUsage(walletAddress) {
  if (!pool) return { walletAddress, stats: { total_queries: 0, total_spent: 0 }, history: [] };
  
  try {
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
        stats: walletResult.rows[0] || { total_queries: 0, total_spent: 0 },
        history: queriesResult.rows
      }
    } finally {
      client.release()
    }
  } catch (err) {
    return { walletAddress, stats: { total_queries: 0, total_spent: 0 }, history: [] };
  }
}

async function getPlatformStats() {
  if (!pool) return { total_queries: 0, total_revenue: 0, unique_wallets: 0, avg_response_time: 0 };
  
  try {
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
  } catch (err) {
    return { total_queries: 0, total_revenue: 0, unique_wallets: 0, avg_response_time: 0 };
  }
}

module.exports = { logQuery, getWalletUsage, getPlatformStats }
