import { Redis } from '@upstash/redis'
import { verifyMessage } from 'viem'

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

const SESSION_TTL = 24 * 60 * 60 // 24 hours in seconds

// Generate a random session token
function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

interface RequestBody {
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
    const { walletAddress, signature, message } = body

    // Validate required fields
    if (!walletAddress || !signature || !message) {
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

    // Check if user has attempts remaining
    const attemptsKey = `attempts:${walletAddress.toLowerCase()}`
    const attempts = await redis.get<number>(attemptsKey)

    if (attempts === null || attempts <= 0) {
      return new Response(JSON.stringify({ error: 'No attempts remaining. Burn a seed first.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Generate session token for this wallet
    const sessionToken = generateSessionToken()
    const sessionKey = `session:${sessionToken}`
    await redis.set(sessionKey, walletAddress.toLowerCase(), { ex: SESSION_TTL })

    return new Response(
      JSON.stringify({
        success: true,
        attemptsRemaining: attempts,
        sessionToken,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Claim session error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
