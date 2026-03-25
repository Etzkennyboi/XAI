const axios = require('axios')
const fs = require('fs')
const path = require('path')

// Load address from .env
const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf8')
const walletMatch = env.match(/RECEIVING_WALLET_ADDRESS="(.*)"/)
const walletAddress = walletMatch ? walletMatch[1] : '0x0000000000000000000000000000000000000000'

async function testApi() {
  console.log('--- TESTING XAI MARKET API ---')
  console.log('Target Wallet:', walletAddress)
  
  try {
    const response = await axios.post('http://localhost:3001/api/chat', {
      model: 'deepseek-v3.2',
      messages: [
        { role: 'user', content: 'teach me physis in two sentence' }
      ]
    }, {
      headers: {
        'x-payment': '0xdemo_tx_hash_for_hackathon',
        'x-wallet-address': walletAddress
      }
    })

    console.log('\n--- AI RESPONSE ---')
    console.log(response.data.choices[0].message.content)
    console.log('\n--- TEST SUCCESSFUL ---')

  } catch (error) {
    console.error('\n--- TEST FAILED ---')
    console.log(error.response?.data || error.message)
  }
}

testApi()
