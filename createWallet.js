require('dotenv').config()
const { ethers } = require('ethers')

async function createReceivingWallet() {
  const wallet = ethers.Wallet.createRandom()

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('XAI MARKET RECEIVING WALLET')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Address:    ', wallet.address)
  console.log('Private Key:', wallet.privateKey)
  console.log('Mnemonic:   ', wallet.mnemonic.phrase)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Add to .env:')
  console.log(`RECEIVING_WALLET_ADDRESS="${wallet.address}"`)
  console.log(`RECEIVING_WALLET_PRIVATE_KEY="${wallet.privateKey}"`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

createReceivingWallet()
