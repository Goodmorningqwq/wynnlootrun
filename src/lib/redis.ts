import { Redis } from '@upstash/redis'

const url = process.env.UPSTASH_REDIS_REST_URL_GUILD
const token = process.env.UPSTASH_REDIS_REST_TOKEN_GUILD

if (!url || !token) {
  console.warn('[Upstash Redis] Missing UPSTASH_REDIS_REST_URL_GUILD or UPSTASH_REDIS_REST_TOKEN_GUILD. Auth and data APIs will not work.')
}

export const redis = new Redis({
  url: url ?? 'https://placeholder.upstash.io',
  token: token ?? 'placeholder',
})
