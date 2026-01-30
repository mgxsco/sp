import { Redis } from '@upstash/redis'
import { verifyMessage } from 'viem'

const MAX_ATTEMPTS = 10
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
  burnTxHash: string
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

  // Check Redis env vars
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return new Response(
      JSON.stringify({ error: 'Server configuration error: Redis not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  })

  try {
    const body: RequestBody = await req.json()
    const { walletAddress, signature, message, burnTxHash } = body

    // Validate required fields
    if (!walletAddress || !signature || !message || !burnTxHash) {
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

    // Check if this burn tx has already been used
    const burnKey = `burn:${burnTxHash.toLowerCase()}`
    const alreadyUsed = await redis.get<boolean>(burnKey)

    if (alreadyUsed) {
      return new Response(JSON.stringify({ error: 'Burn transaction already used' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // TODO: Optionally verify the burn transaction on-chain
    // This would require checking the transaction receipt to confirm:
    // 1. It's a valid burn transaction to the seed contract
    // 2. The sender matches the walletAddress
    // For now, we trust the signature verification

    // Mark this burn tx as used
    await redis.set(burnKey, true)

    // Reset attempts for this wallet
    const attemptsKey = `attempts:${walletAddress.toLowerCase()}`
    await redis.set(attemptsKey, MAX_ATTEMPTS)

    // Generate session token for this wallet
    const sessionToken = generateSessionToken()
    const sessionKey = `session:${sessionToken}`
    await redis.set(sessionKey, walletAddress.toLowerCase(), { ex: SESSION_TTL })

    return new Response(
      JSON.stringify({
        success: true,
        attemptsRemaining: MAX_ATTEMPTS,
        sessionToken,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Reset attempts error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
