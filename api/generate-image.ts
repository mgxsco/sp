import { Redis } from '@upstash/redis'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const MAX_ATTEMPTS = 10

interface RequestBody {
  prompt: string
  walletAddress: string
  sessionToken: string
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

  // Check env vars
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return new Response(
      JSON.stringify({ error: 'Server configuration error: Redis not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Server configuration error: Gemini API not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  })

  try {
    const body: RequestBody = await req.json()
    const { prompt, walletAddress, sessionToken } = body

    // Validate required fields
    if (!prompt || !walletAddress || !sessionToken) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Verify session token
    const sessionKey = `session:${sessionToken}`
    const sessionWallet = await redis.get<string>(sessionKey)

    if (!sessionWallet || sessionWallet !== walletAddress.toLowerCase()) {
      return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
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
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isRedisError = errorMessage.includes('UPSTASH') || errorMessage.includes('Redis') || errorMessage.includes('fetch failed')
    return new Response(
      JSON.stringify({
        error: isRedisError ? 'Redis connection failed' : 'Internal server error',
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
