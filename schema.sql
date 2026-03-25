-- Run this in Railway PostgreSQL console

CREATE TABLE queries (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  model TEXT NOT NULL,
  amount_paid DECIMAL NOT NULL,
  payment_method TEXT DEFAULT 'api',
  tokens_used INTEGER DEFAULT 0,
  response_time_ms INTEGER DEFAULT 0,
  status TEXT DEFAULT 'success',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE wallets (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  total_queries INTEGER DEFAULT 0,
  total_spent DECIMAL DEFAULT 0,
  first_seen TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_queries_wallet ON queries(wallet_address);
CREATE INDEX idx_queries_created ON queries(created_at);
CREATE INDEX idx_queries_model ON queries(model);
