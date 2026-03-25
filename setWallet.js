const { ethers } = require('ethers')
const fs = require('fs')
const path = require('path')

const wallet = ethers.Wallet.createRandom()
console.log('--- NEW WALLET GENERATED ---')
console.log('Address:    ', wallet.address)
console.log('Private Key:', wallet.privateKey)

const envPath = path.join(__dirname, '.env')
let envContent = fs.readFileSync(envPath, 'utf8')

envContent = envContent.replace(/RECEIVING_WALLET_ADDRESS=".*"/, `RECEIVING_WALLET_ADDRESS="${wallet.address}"`)
envContent = envContent.replace(/RECEIVING_WALLET_PRIVATE_KEY=".*"/, `RECEIVING_WALLET_PRIVATE_KEY="${wallet.privateKey}"`)

fs.writeFileSync(envPath, envContent)
console.log('--- .env UPDATED ---')
