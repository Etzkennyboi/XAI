require('dotenv').config()

module.exports = {
  okx: {
    apiKey: process.env.OKX_API_KEY,
    secretKey: process.env.OKX_SECRET_KEY,
    passphrase: process.env.OKX_PASSPHRASE,
  },
  wallet: {
    address: process.env.RECEIVING_WALLET_ADDRESS,
    privateKey: process.env.RECEIVING_WALLET_PRIVATE_KEY
  },
  database: {
    url: process.env.DATABASE_URL
  },
  port: process.env.PORT || 3001
}
