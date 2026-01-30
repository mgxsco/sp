import { Redis } from '@upstash/redis'

const MAX_ATTEMPTS = 10

export const config = {
  runtime: 'edge',
}

export default async function handler(req: Request) {
  // Only allow GET
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Check Redis env vars
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.error('Missing Redis environment variables')
    return new Response(
      JSON.stringify({ error: 'Server configuration error', attemptsRemaining: MAX_ATTEMPTS }),
      {
        status: 200, // Return 200 with default attempts so UI doesn't break
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  })

  try {
    const url = new URL(req.url)
    const walletAddress = url.searchParams.get('wallet')

    if (!walletAddress) {
      return new Response(JSON.stringify({ error: 'Missing wallet address' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get remaining attempts from Redis
    const key = `attempts:${walletAddress.toLowerCase()}`
    const attempts = await redis.get<number>(key)

    return new Response(
      JSON.stringify({
        attemptsRemaining: attempts ?? MAX_ATTEMPTS,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Get attempts error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
