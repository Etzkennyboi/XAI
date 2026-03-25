const axios = require('axios')
const config = require('../config/env')

/**
 * XAI Market — Official NVIDIA NIM Model Configuration
 * Provided by USER for project X Layer Onchain OS AI Hackathon
 */
const MODELS = {
  'deepseek-v3.2': {
    name: 'DeepSeek V3.2',
    nvidiaModel: 'deepseek-ai/deepseek-v3.2',
    apiKey: process.env.NVIDIA_DEEPSEEK_KEY || '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',
    maxTokens: 8192,
    temperature: 1.0,
    topP: 0.95,
    price: 0.01,
    thinking: true,
    description: 'Deep reasoning, coding, complex analysis'
  },
  'gpt-oss-120b': {
    name: 'GPT-OSS 120B',
    nvidiaModel: 'openai/gpt-oss-120b',
    apiKey: process.env.NVIDIA_GPT_OSS_KEY || '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',
    maxTokens: 4096,
    temperature: 1.0,
    topP: 1.0,
    price: 0.01,
    thinking: false,
    description: 'General intelligence, complex tasks'
  },
  'kimi-k2.5': {
    name: 'Kimi K2.5',
    nvidiaModel: 'moonshotai/kimi-k2.5',
    apiKey: process.env.NVIDIA_KIMI_KEY || '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',
    maxTokens: 16384,
    temperature: 1.0,
    topP: 1.0,
    price: 0.01,
    thinking: true,
    description: 'Longest context, deep document analysis'
  },
  'llama-3.3-70b': {
    name: 'Llama 3.3 70B',
    nvidiaModel: 'meta/llama-3.3-70b-instruct',
    apiKey: process.env.NVIDIA_LLAMA_KEY || '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',
    maxTokens: 1024,
    temperature: 0.2,
    topP: 0.7,
    price: 0.01,
    thinking: false,
    description: 'Fastest model, quick lightweight queries'
  },
  'minimax-m2.5': {
    name: 'MiniMax M2.5',
    nvidiaModel: 'minimaxai/minimax-m2.5',
    apiKey: process.env.NVIDIA_MINIMAX_KEY || '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',
    maxTokens: 8192,
    temperature: 1.0,
    topP: 0.95,
    price: 0.01,
    thinking: false,
    description: 'Creative tasks, content generation'
  },
  'qwen3-80b': {
    name: 'Qwen3 80B',
    nvidiaModel: 'qwen/qwen3-next-80b-a3b-instruct',
    apiKey: process.env.NVIDIA_QWEN_KEY || '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',
    maxTokens: 4096,
    temperature: 0.6,
    topP: 0.7,
    price: 0.01,
    thinking: false,
    description: 'Structured output, instruction following'
  }
}

async function callModel(modelId, messages, customMaxTokens) {
  const model = MODELS[modelId]
  if (!model) throw new Error(`Model ${modelId} not found`)

  const startTime = Date.now()

  const payload = {
    model: model.nvidiaModel,
    messages,
    max_tokens: customMaxTokens || model.maxTokens,
    temperature: model.temperature,
    top_p: model.topP,
    stream: false
  }

  if (model.thinking) {
    payload.chat_template_kwargs = { thinking: true }
  }

  console.log(`[${new Date().toISOString()}] Calling NVIDIA NIM Model: ${model.nvidiaModel}...`)
  
  try {
    const response = await axios.post(
      'https://integrate.api.nvidia.com/v1/chat/completions',
      payload,
      {
        headers: {
          'Authorization': `Bearer ${model.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 300000
      }
    )

    const responseTimeMs = Date.now() - startTime
    console.log(`[${new Date().toISOString()}] ${modelId} responded in ${responseTimeMs}ms`)

    return {
      data: response.data,
      responseTimeMs,
      tokensUsed: response.data.usage?.total_tokens || 0
    }
  } catch (err) {
    const errorBody = err.response?.data
    console.error(`Error calling ${modelId}:`, errorBody || err.message)
    throw new Error(errorBody?.message || err.message)
  }
}

async function callModelStream(modelId, messages, customMaxTokens) {
  const model = MODELS[modelId]
  if (!model) throw new Error(`Model ${modelId} not found`)

  const payload = {
    model: model.nvidiaModel,
    messages,
    max_tokens: customMaxTokens || model.maxTokens,
    temperature: model.temperature,
    top_p: model.topP,
    stream: true
  }

  if (model.thinking) {
    payload.chat_template_kwargs = { thinking: true }
  }

  return axios.post(
    'https://integrate.api.nvidia.com/v1/chat/completions',
    payload,
    {
      headers: {
        'Authorization': `Bearer ${model.apiKey}`,
        'Content-Type': 'application/json'
      },
      responseType: 'stream',
      timeout: 300000
    }
  )
}

function getModelInfo(modelId) {
  return MODELS[modelId] || null
}

function getAllModels() {
  return Object.entries(MODELS).map(([id, model]) => ({
    id,
    name: model.name,
    price: model.price,
    maxTokens: model.maxTokens,
    description: model.description,
    thinking: model.thinking,
    currency: 'USDC'
  }))
}

function getPrice(modelId) {
  return MODELS[modelId]?.price || 0.01
}

module.exports = { callModel, callModelStream, getModelInfo, getAllModels, getPrice }
