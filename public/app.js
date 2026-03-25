// ========== XAI MARKET FRONTEND ==========

const API_BASE = window.location.origin;

// USDC contract on X Layer
const USDC_CONTRACT = '0x74b7f16337b8972027f6196a17a631ac6de26d22';
const XLAYER_CHAIN_ID = '0xc4'; // 196 in hex
const QUERY_PRICE = 0.01;
const QUERY_PRICE_WEI = '10000'; // 0.01 USDC = 10000 (6 decimals)

const ERC20_TRANSFER_ABI = '0xa9059cbb'; // transfer(address,uint256)

let connectedWallet = null;
let receivingWallet = null;

const MODEL_DATA = {
  'deepseek-v3.2': {
    name: 'DeepSeek V3.2',
    price: 0.01,
    maxTokens: 8192,
    description: 'Deep reasoning, coding, complex analysis',
    tags: [{ text: '8192 tokens', cls: '' }, { text: 'Thinking Mode', cls: 'thinking' }]
  },
  'gpt-oss-120b': {
    name: 'GPT-OSS 120B',
    price: 0.01,
    maxTokens: 4096,
    description: 'General intelligence, complex tasks',
    tags: [{ text: '4096 tokens', cls: '' }, { text: '120B params', cls: '' }]
  },
  'kimi-k2.5': {
    name: 'Kimi K2.5',
    price: 0.01,
    maxTokens: 16384,
    description: 'Longest context, deep document analysis',
    tags: [{ text: '16384 tokens', cls: '' }, { text: 'Thinking Mode', cls: 'thinking' }]
  },
  'llama-3.3-70b': {
    name: 'Llama 3.3 70B',
    price: 0.01,
    maxTokens: 1024,
    description: 'Fastest model, quick lightweight queries',
    tags: [{ text: '1024 tokens', cls: '' }, { text: 'Low Latency', cls: '' }]
  },
  'minimax-m2.5': {
    name: 'MiniMax M2.5',
    price: 0.01,
    maxTokens: 8192,
    description: 'Creative tasks, content generation',
    tags: [{ text: '8192 tokens', cls: '' }, { text: 'Creative', cls: '' }]
  },
  'qwen3-80b': {
    name: 'Qwen3 80B',
    price: 0.01,
    maxTokens: 4096,
    description: 'Structured output, instruction following',
    tags: [{ text: '4096 tokens', cls: '' }, { text: 'Reliable', cls: '' }]
  }
};

// ========== NAVIGATION ==========

function navigateTo(page) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));

  document.getElementById(`page-${page}`).classList.add('active');
  const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');

  window.scrollTo(0, 0);
}

function toggleMobileMenu() {
  const navLinks = document.getElementById('nav-links');
  const toggle = document.getElementById('menu-toggle');
  navLinks.classList.toggle('active');
  toggle.classList.toggle('active');
}

function closeMobileMenu() {
  const navLinks = document.getElementById('nav-links');
  const toggle = document.getElementById('menu-toggle');
  navLinks.classList.remove('active');
  toggle.classList.remove('active');
}

// ========== INITIAL RENDER ==========

function renderModelCards() {
  const grid = document.getElementById('models-grid');
  const pgSelect = document.getElementById('pg-model');
  
  grid.innerHTML = '';
  pgSelect.innerHTML = '';

  Object.entries(MODEL_DATA).forEach(([id, model], index) => {
    // Render gallery card
    const card = document.createElement('div');
    card.className = 'model-card';
    card.style.animationDelay = `${index * 0.1}s`;

    const tagsHtml = model.tags.map(t =>
      `<span class="tag ${t.cls}">${t.text}</span>`
    ).join('');

    card.innerHTML = `
      <div class="card-top">
        <div class="model-name">${model.name}</div>
        <div class="model-price">$${model.price.toFixed(2)} USDC</div>
      </div>
      <div class="model-desc">${model.description}</div>
      <div class="model-tags">${tagsHtml}</div>
      <button class="btn-main btn-secondary" onclick="tryInPlayground('${id}')" style="width:100%; border-radius:12px;">
        Try Inference
      </button>
    `;
    grid.appendChild(card);

    // Populate playground select
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = model.name;
    pgSelect.appendChild(opt);
  });

  updateModelInfo();
}

function tryInPlayground(id) {
  document.getElementById('pg-model').value = id;
  updateModelInfo();
  navigateTo('playground');
}

function updateModelInfo() {
  const modelId = document.getElementById('pg-model').value;
  const model = MODEL_DATA[modelId];
  const infoEl = document.getElementById('pg-model-info');
  const activeDisplay = document.getElementById('active-model-display');

  if (activeDisplay) activeDisplay.textContent = model.name;

  infoEl.innerHTML = `
    <div style="font-weight:700; font-size:1rem; margin-bottom:4px;">${model.name}</div>
    <div style="color:var(--accent-emerald); font-family:'JetBrains Mono',monospace; font-weight:700; font-size:0.85rem;">$${model.price.toFixed(2)} USDC / query</div>
    <div style="font-size:0.8rem; color:var(--text-muted); margin-top:10px;">${model.description}</div>
  `;
}

function togglePgSettings() {
  document.getElementById('pg-sidebar').classList.toggle('active');
}

// ========== WALLET LOGIC ==========

async function connectWallet() {
  if (!window.ethereum) {
    alert('MetaMask not detected! Please install it to continue.');
    return;
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    connectedWallet = accounts[0];

    // Force switch to X Layer — mandatory
    await switchToXLayer();

    // Verify we are on X Layer
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (chainId !== XLAYER_CHAIN_ID) {
      alert('Please switch to X Layer Mainnet (Chain ID 196) in your wallet to continue.');
      connectedWallet = null;
      return;
    }

    // Get receiving info
    try {
      const res = await fetch(`${API_BASE}/api/info`);
      const data = await res.json();
      receivingWallet = data.receivingWallet;
    } catch (e) {
      console.warn('Could not fetch /api/info, using fallback wallet');
      receivingWallet = '0x07fFCc694F4afE3C4BAE71b54262cc4BA57b0120';
    }

    console.log('Connected:', connectedWallet, '| Chain:', chainId, '| PayTo:', receivingWallet);
    updateWalletUI();
  } catch (err) {
    console.error('Wallet Error:', err);
    alert('Wallet connection failed: ' + (err.message || 'Unknown error'));
  }
}

async function switchToXLayer() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: XLAYER_CHAIN_ID }]
    });
  } catch (err) {
    // 4902 = chain not added yet
    if (err.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: XLAYER_CHAIN_ID,
          chainName: 'X Layer Mainnet',
          nativeCurrency: { name: 'OKB', symbol: 'OKB', decimals: 18 },
          rpcUrls: ['https://rpc.xlayer.tech'],
          blockExplorerUrls: ['https://www.oklink.com/xlayer']
        }]
      });
    } else {
      // User rejected or other error — re-throw so connectWallet catches it
      throw err;
    }
  }
}

function updateWalletUI() {
  if (connectedWallet) {
    document.getElementById('wallet-connect-btn').style.display = 'none';
    const display = document.getElementById('wallet-connected');
    display.style.display = 'flex';
    document.getElementById('wallet-address-display').textContent = connectedWallet.slice(0, 6) + '...' + connectedWallet.slice(-4);
  }
}

// ========== PAYMENT & QUERY ==========

async function sendPlaygroundQuery() {
  const prompt = document.getElementById('pg-prompt').value.trim();
  const modelId = document.getElementById('pg-model').value;
  if (!prompt || !connectedWallet) {
    if(!connectedWallet) alert('Connect your wallet first!');
    return;
  }

  const messagesEl = document.getElementById('pg-messages');
  const btn = document.getElementById('pg-send-btn');
  const btnText = document.getElementById('btn-text');

  // Add user message
  const userMsg = document.createElement('div');
  userMsg.className = 'chat-msg msg-user';
  userMsg.textContent = prompt;
  messagesEl.appendChild(userMsg);
  document.getElementById('pg-prompt').value = '';

  try {
    btn.disabled = true;
    btnText.textContent = 'Switching to X Layer...';

    // 0. Force X Layer before every transaction
    await switchToXLayer();
    const currentChain = await window.ethereum.request({ method: 'eth_chainId' });
    if (currentChain !== XLAYER_CHAIN_ID) {
      alert('You must be on X Layer Mainnet to send queries. Please switch networks.');
      btn.disabled = false;
      btnText.textContent = 'Pay & Send';
      return;
    }

    btnText.textContent = 'Awaiting Tx...';

    // 1. Check USDC balance first
    const payTo = receivingWallet || '0x07fFCc694F4afE3C4BAE71b54262cc4BA57b0120';
    if (!payTo || payTo === 'undefined') {
      alert('Could not determine the receiving wallet. Please reconnect your wallet.');
      btn.disabled = false;
      btnText.textContent = 'Pay & Send';
      return;
    }

    // Call balanceOf(address) on USDC contract — selector 0x70a08231
    const balanceOfData = '0x70a08231' + connectedWallet.toLowerCase().replace('0x', '').padStart(64, '0');
    try {
      const balanceHex = await window.ethereum.request({
        method: 'eth_call',
        params: [{ to: USDC_CONTRACT, data: balanceOfData }, 'latest']
      });
      const balance = parseInt(balanceHex, 16);
      const needed = parseInt(QUERY_PRICE_WEI); // 10000 = $0.01 USDC (6 decimals)
      console.log('USDC Balance:', balance, '| Needed:', needed);

      if (balance < needed) {
        alert(`Insufficient USDC balance!\n\nYou have: $${(balance / 1e6).toFixed(6)} USDC\nYou need: $${(needed / 1e6).toFixed(2)} USDC\n\nPlease fund your wallet with USDC on X Layer (Chain ID 196).`);
        btn.disabled = false;
        btnText.textContent = 'Pay & Send';
        return;
      }
    } catch (balErr) {
      console.warn('Could not check USDC balance:', balErr.message);
      // Continue anyway — let MetaMask handle it
    }

    // 2. Send USDC transfer
    const toAddressEncoded = payTo.toLowerCase().replace('0x', '').padStart(64, '0');
    const amountEncoded = parseInt(QUERY_PRICE_WEI).toString(16).padStart(64, '0');
    const data = ERC20_TRANSFER_ABI + toAddressEncoded + amountEncoded;

    console.log('Sending USDC to:', payTo, 'Amount:', QUERY_PRICE_WEI);

    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from: connectedWallet,
        to: USDC_CONTRACT,
        data: data,
        value: '0x0'
      }]
    });

    btnText.textContent = 'Querying AI...';

    // 2. Call backend
    const res = await fetch(`${API_BASE}/api/chat/playground`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: prompt }],
        txHash,
        walletAddress: connectedWallet
      })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Model query failed');
    }

    const assistantMsg = document.createElement('div');
    assistantMsg.className = 'chat-msg msg-assistant';
    const contentDiv = document.createElement('div');
    contentDiv.className = 'markdown-body';
    assistantMsg.appendChild(contentDiv);
    messagesEl.appendChild(assistantMsg);
    
    // Handle Stream
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let reasoningText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.trim() || line.includes('[DONE]')) continue;
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.replace('data: ', ''));
            const delta = data.choices?.[0]?.delta?.content || '';
            const reasoning = data.choices?.[0]?.delta?.reasoning_content || '';
            
            if (reasoning) {
              reasoningText += reasoning;
            }
            if (delta) {
              fullText += delta;
            }

            // Update UI with reasoning (italic) + content
            let displayHtml = '';
            if (reasoningText) {
              displayHtml += `<div style="color:var(--text-muted); font-style:italic; font-size:0.85rem; margin-bottom:10px; padding-bottom:10px; border-bottom:1px dashed var(--border-glass);">Reasoning:<br>${reasoningText}</div>`;
            }
            displayHtml += marked.parse(fullText);
            contentDiv.innerHTML = displayHtml;
            messagesEl.scrollTop = messagesEl.scrollHeight;
          } catch (e) {
            console.warn('Error parsing stream chunk', e);
          }
        }
      }
    }
  } catch (err) {
    console.error('Playground Query Error:', err);
    alert('Request failed: ' + err.message);
  } finally {
    btn.disabled = false;
    btnText.textContent = 'Pay & Send';
  }
}

// ========== STATS & USAGE ==========

async function loadHomeStats() {
  try {
    const res = await fetch(`${API_BASE}/api/balance`);
    const data = await res.json();
    if (data.stats) {
      document.getElementById('stat-queries').textContent = data.stats.totalQueries || 0;
      document.getElementById('stat-revenue').textContent = data.stats.totalRevenue || '$0.00';
      document.getElementById('stat-wallets').textContent = data.stats.uniqueWallets || 0;
      document.getElementById('stat-speed').textContent = data.stats.avgResponseTime || '0ms';
    }
  } catch (e) {}
}

async function loadUsage() {
  const wallet = document.getElementById('usage-wallet-input').value.trim();
  if (!wallet) return;

  try {
    const res = await fetch(`${API_BASE}/api/usage/${wallet}`);
    const data = await res.json();
    if (data.usage?.history) {
      const body = document.getElementById('usage-table-body');
      body.innerHTML = data.usage.history.map(q => `
        <tr style="border-bottom:1px solid var(--border-glass);">
          <td style="padding:12px; font-size:0.85rem;">${new Date(q.created_at).toLocaleString()}</td>
          <td style="padding:12px; font-size:0.85rem;"><code>${q.model}</code></td>
          <td style="padding:12px; font-size:0.85rem;">$${parseFloat(q.amount_paid).toFixed(2)}</td>
          <td style="padding:12px; font-size:0.85rem;"><span style="color:var(--accent-emerald)">SUCCESS</span></td>
        </tr>
      `).join('');
    }
  } catch (e) {}
}

// ========== UTILS ==========

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========== INIT ==========

document.addEventListener('DOMContentLoaded', () => {
  renderModelCards();
  loadHomeStats();
  updateModelInfo();
});
