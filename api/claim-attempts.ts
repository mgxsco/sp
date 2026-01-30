import { Redis } from '@upstash/redis'
import { verifyMessage } from 'viem'

const MAX_ATTEMPTS = 10
const SESSION_TTL = 24 * 60 * 60 // 24 hours

function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

interface RequestBody {
  walletAddress: string
  signature: string
  message: string
  pendingReveals: number // From frontend - we trust this for now
}

export const config = {
  runtime: 'edge',
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  })

  try {
    const body: RequestBody = await req.json()
    const { walletAddress, signature, message, pendingReveals } = body

    if (!walletAddress || !signature || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Verify signature
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

    // Check if user already has attempts (prevent double-claiming)
    const attemptsKey = `attempts:${walletAddress.toLowerCase()}`
    const existingAttempts = await redis.get<number>(attemptsKey)

    if (existingAttempts !== null && existingAttempts > 0) {
      // Already has attempts, just return current state
      const sessionToken = generateSessionToken()
      const sessionKey = `session:${sessionToken}`
      await redis.set(sessionKey, walletAddress.toLowerCase(), { ex: SESSION_TTL })

      return new Response(
        JSON.stringify({
          success: true,
          attemptsRemaining: existingAttempts,
          sessionToken,
          message: 'Already have attempts',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has pending reveals (from frontend)
    if (pendingReveals <= 0) {
      return new Response(
        JSON.stringify({ error: 'No pending reveals. Burn a seed first.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Grant attempts based on pending reveals
    await redis.set(attemptsKey, MAX_ATTEMPTS)

    // Generate session token
    const sessionToken = generateSessionToken()
    const sessionKey = `session:${sessionToken}`
    await redis.set(sessionKey, walletAddress.toLowerCase(), { ex: SESSION_TTL })

    return new Response(
      JSON.stringify({
        success: true,
        attemptsRemaining: MAX_ATTEMPTS,
        sessionToken,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Claim attempts error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
