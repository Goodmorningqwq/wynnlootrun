import { NextRequest } from 'next/server'
import { redis } from '@/lib/redis'
import { getCurrentUser } from '@/lib/auth-middleware'

interface UserData {
  guildName: string | null
  trackedPlayers: string[]
  activeEvent: Record<string, unknown> | null
  isGuildAccount?: boolean
}

interface ActiveEvent {
  metric?: string
  scope?: string
  trackedPlayers?: string[]
  refreshCooldownMs?: number
  startedAt?: number
  lastRefreshAt?: number
  firstRefreshDone?: boolean
  eventCode?: string | null
  isPublic?: boolean
  baseline?: Record<string, unknown> | null
  current?: Record<string, unknown> | null
  guildName?: string
}

function getDefaultUserData(): UserData {
  return {
    guildName: null,
    trackedPlayers: [],
    activeEvent: null,
  }
}

function sanitizeActiveEvent(value: Record<string, unknown>): ActiveEvent | null {
  if (!value || typeof value !== 'object') return null
  const allowedMetrics = ['xp', 'wars', 'guildRaids']
  const metric = allowedMetrics.includes(value.metric as string) ? (value.metric as string) : 'xp'
  const scope = value.scope === 'guild' ? 'guild' : 'selected'
  const trackedPlayers = Array.isArray(value.trackedPlayers)
    ? (value.trackedPlayers as string[]).filter((p) => typeof p === 'string').slice(0, 100)
    : []
  const refreshCooldownMs = Number(value.refreshCooldownMs || 15 * 60 * 1000)
  const startedAt = Number(value.startedAt || Date.now())
  const lastRefreshAt = Number(value.lastRefreshAt || startedAt)
  const firstRefreshDone = Boolean(value.firstRefreshDone)
  const eventCode = typeof value.eventCode === 'string' ? value.eventCode.trim().toUpperCase() : null
  const isPublic = Boolean(value.isPublic)
  const baseline = value.baseline && typeof value.baseline === 'object' ? (value.baseline as Record<string, unknown>) : null
  const current = value.current && typeof value.current === 'object' ? (value.current as Record<string, unknown>) : baseline
  const guildName = typeof value.guildName === 'string' ? value.guildName : undefined

  return {
    metric,
    scope,
    trackedPlayers,
    refreshCooldownMs,
    startedAt,
    lastRefreshAt,
    firstRefreshDone,
    eventCode,
    isPublic,
    baseline,
    current,
    guildName,
  }
}

function parseJsonSafe(value: unknown, fallback: unknown): unknown {
  if (!value) return fallback
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

async function locateAccount(username: string): Promise<{ dataKey: string; eventsKey: string; data: UserData | null } | null> {
  const guildDataKey = `guild:${username}:data`
  const userDataKey = `user:${username}:data`

  const [guildDataStr, userDataStr] = await Promise.all([
    redis.get(guildDataKey),
    redis.get(userDataKey),
  ])

  const guildData = parseJsonSafe(guildDataStr, null) as UserData | null
  const userData = parseJsonSafe(userDataStr, null) as UserData | null

  if (guildData) {
    return { dataKey: guildDataKey, eventsKey: `guild:${username}:events`, data: guildData }
  }

  if (userData) {
    return { dataKey: userDataKey, eventsKey: `user:${username}:events`, data: userData }
  }

  return null
}

export async function GET(request: NextRequest) {
  const username = getCurrentUser(request)
  if (!username) {
    return Response.json({ error: 'Username required' }, { status: 400 })
  }

  const includeEvents = request.nextUrl.searchParams.get('includeEvents') === 'true'

  try {
    const account = await locateAccount(username)
    const dataKey = account?.dataKey ?? `user:${username}:data`
    const eventsKey = account?.eventsKey ?? `user:${username}:events`

    const [userDataStr, events] = await Promise.all([
      account ? null : redis.get(dataKey),
      includeEvents ? redis.lrange(eventsKey, 0, 49) : [],
    ])

    const userData = account?.data ?? (parseJsonSafe(userDataStr, getDefaultUserData()) as UserData)
    const parsedEvents = events
      .map((e: unknown) => parseJsonSafe(e, null))
      .filter(Boolean)
      .reverse()

    return Response.json({
      username,
      guildName: userData.guildName,
      trackedPlayers: userData.trackedPlayers || [],
      activeEvent: userData.activeEvent,
      events: parsedEvents,
    })
  } catch (e) {
    console.error('Get data error:', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const username = getCurrentUser(request)
  if (!username) {
    return Response.json({ error: 'Username required' }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const {
    guildName,
    trackedPlayers,
    activeEvent,
    addEvent,
    addPlayer,
    removePlayer,
    clearPlayers,
    isGuildAccount,
  } = body

  try {
    const account = await locateAccount(username)
    let dataKey: string
    let eventsKey: string
    let userData: UserData

    if (account) {
      dataKey = account.dataKey
      eventsKey = account.eventsKey
      userData = account.data!
    } else {
      dataKey = `user:${username}:data`
      eventsKey = `user:${username}:events`
      userData = getDefaultUserData()
    }

    const beforeJson = JSON.stringify(userData)

    if (guildName !== undefined) {
      if (guildName !== userData.guildName && userData.trackedPlayers.length > 0) {
        return Response.json({ error: 'You can only track players from one guild. Clear current players first.' }, { status: 400 })
      }
      userData.guildName = guildName as string | null
    }

    if (trackedPlayers !== undefined) {
      if (!Array.isArray(trackedPlayers)) {
        return Response.json({ error: 'trackedPlayers must be an array' }, { status: 400 })
      }
      userData.trackedPlayers = trackedPlayers as string[]
    }

    if (addPlayer !== undefined) {
      if (userData.trackedPlayers.length >= 20) {
        return Response.json({ error: 'Maximum 20 players allowed per user' }, { status: 400 })
      }
      if (!userData.trackedPlayers.includes(addPlayer as string)) {
        userData.trackedPlayers.push(addPlayer as string)
      }
    }

    if (removePlayer !== undefined) {
      userData.trackedPlayers = userData.trackedPlayers.filter((p) => p !== removePlayer)
    }

    if (clearPlayers !== undefined) {
      userData.trackedPlayers = []
      userData.activeEvent = null
    }

    if (activeEvent !== undefined) {
      const sanitizedEvent = sanitizeActiveEvent(activeEvent as Record<string, unknown>)
      if (sanitizedEvent && userData.guildName && sanitizedEvent.guildName && sanitizedEvent.guildName !== userData.guildName) {
        return Response.json({ error: 'Active event guild must match tracked guild' }, { status: 400 })
      }
      userData.activeEvent = sanitizedEvent as unknown as Record<string, unknown> | null
    }

    if (isGuildAccount !== undefined) {
      userData.isGuildAccount = Boolean(isGuildAccount)
    }

    const afterJson = JSON.stringify(userData)

    if (isGuildAccount === true && dataKey.startsWith('user:')) {
      const newDataKey = `guild:${username}:data`
      const newEventsKey = `guild:${username}:events`
      await Promise.all([
        redis.del(dataKey),
        redis.set(newDataKey, afterJson),
      ])
      const oldEvents = await redis.lrange(eventsKey, 0, -1)
      if (oldEvents.length > 0) {
        const pipeline = redis.pipeline()
        for (const ev of oldEvents) {
          pipeline.lpush(newEventsKey, ev as string | number)
        }
        pipeline.exec()
        await redis.del(eventsKey)
      }
      dataKey = newDataKey
      eventsKey = newEventsKey
    } else if (isGuildAccount === false && dataKey.startsWith('guild:')) {
      const newDataKey = `user:${username}:data`
      const newEventsKey = `user:${username}:events`
      await Promise.all([
        redis.del(dataKey),
        redis.set(newDataKey, afterJson),
      ])
      const oldEvents = await redis.lrange(eventsKey, 0, -1)
      if (oldEvents.length > 0) {
        const pipeline = redis.pipeline()
        for (const ev of oldEvents) {
          pipeline.lpush(newEventsKey, ev as string | number)
        }
        pipeline.exec()
        await redis.del(eventsKey)
      }
      dataKey = newDataKey
      eventsKey = newEventsKey
    } else if (beforeJson !== afterJson) {
      await redis.set(dataKey, afterJson)
    }

    if (addEvent) {
      await redis.lpush(eventsKey, JSON.stringify(addEvent))
      await redis.ltrim(eventsKey, 0, 99)
    }

    return Response.json({ success: true, trackedPlayers: userData.trackedPlayers })
  } catch (e) {
    console.error('Update data error:', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const username = getCurrentUser(request)
  if (!username) {
    return Response.json({ error: 'Username required' }, { status: 400 })
  }

  const usernameLower = username.toLowerCase()
  const candidateUsernames = Array.from(new Set(
    [username, usernameLower].filter((v) => typeof v === 'string' && v.length > 0)
  ))

  try {
    const keysToDelete: string[] = []
    for (const candidate of candidateUsernames) {
      keysToDelete.push(`user:${candidate}:data`)
      keysToDelete.push(`user:${candidate}:events`)
      keysToDelete.push(`guild:${candidate}:data`)
      keysToDelete.push(`guild:${candidate}:events`)
    }
    if (keysToDelete.length) {
      await redis.del(...keysToDelete)
    }
    return Response.json({ success: true })
  } catch (e) {
    console.error('Delete data error:', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
