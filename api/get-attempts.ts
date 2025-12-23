import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

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
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
