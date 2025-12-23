import { Redis } from '@upstash/redis'
import { verifyMessage } from 'viem'

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const MAX_ATTEMPTS = 10

interface RequestBody {
  prompt: string
  walletAddress: string
  signature: string
  message: string
}

export const config = {
  runtime: 'edge',
}

export default async function handler(req: Request) {
  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body: RequestBody = await req.json()
    const { prompt, walletAddress, signature, message } = body

    // Validate required fields
    if (!prompt || !walletAddress || !signature || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Verify the signature matches the wallet address
    const isValid = await verifyMessage({
      address: walletAddress as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    })

    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check if message is recent (within 5 minutes) to prevent replay attacks
    const messageData = JSON.parse(message)
    const timestamp = messageData.timestamp
    const now = Date.now()
    if (now - timestamp > 5 * 60 * 1000) {
      return new Response(JSON.stringify({ error: 'Signature expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get remaining attempts from Redis
    const key = `attempts:${walletAddress.toLowerCase()}`
    let attempts = await redis.get<number>(key)

    if (attempts === null) {
      // First time user - they need to burn a seed first
      // Check if they have a pending reveal (this would need contract verification)
      // For now, we'll initialize with MAX_ATTEMPTS when they first call
      attempts = MAX_ATTEMPTS
    }

    if (attempts <= 0) {
      return new Response(JSON.stringify({ error: 'No attempts remaining' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
          },
        }),
      }
    )

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json().catch(() => ({}))
      return new Response(
        JSON.stringify({ error: errorData.error?.message || 'Gemini API error' }),
        {
          status: geminiResponse.status,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const data = await geminiResponse.json()

    // Find image in response
    const candidates = data.candidates || []
    if (candidates.length === 0) {
      return new Response(JSON.stringify({ error: 'No image generated' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const parts = candidates[0]?.content?.parts || []
    const imagePart = parts.find((p: { inlineData?: { data: string } }) => p.inlineData?.data)

    if (!imagePart?.inlineData?.data) {
      return new Response(JSON.stringify({ error: 'No image in response' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Decrement attempts and save
    const newAttempts = attempts - 1
    await redis.set(key, newAttempts)

    return new Response(
      JSON.stringify({
        imageData: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType || 'image/png',
        attemptsRemaining: newAttempts,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Generate image error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
