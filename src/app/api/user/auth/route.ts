import { NextRequest } from 'next/server'
import { redis } from '@/lib/redis'
import { hashPassword, generateSalt, safeEqual, simpleHash } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action')

  if (action === 'login') {
    return handleLogin(request)
  }

  if (action === 'register') {
    return handleRegister(request)
  }

  return Response.json({ error: 'Invalid action. Use ?action=login or ?action=register' }, { status: 400 })
}

async function handleLogin(request: NextRequest) {
  let username: string | undefined
  let password: string | undefined
  try {
    const body = await request.json()
    username = body.username
    password = body.password
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!username || !password) {
    return Response.json({ error: 'Username and password required' }, { status: 400 })
  }

  const normalizedUsername = username.toLowerCase()
  const usersKey = 'users'

  try {
    const userDataStr = await redis.hget(usersKey, normalizedUsername)

    if (!userDataStr) {
      return Response.json({ error: 'Invalid username or password' }, { status: 401 })
    }

    const userData = typeof userDataStr === 'string' ? JSON.parse(userDataStr) : userDataStr
    let validPassword = false

    if (userData.passwordSalt && userData.passwordHash) {
      const passwordHash = hashPassword(password, userData.passwordSalt)
      validPassword = safeEqual(userData.passwordHash, passwordHash)
    } else if (userData.passwordHash) {
      validPassword = userData.passwordHash === simpleHash(password)
      if (validPassword) {
        const passwordSalt = generateSalt()
        userData.passwordSalt = passwordSalt
        userData.passwordHash = hashPassword(password, passwordSalt)
        await redis.hset(usersKey, { [normalizedUsername]: JSON.stringify(userData) })
      }
    }

    if (!validPassword) {
      return Response.json({ error: 'Invalid username or password' }, { status: 401 })
    }

    return Response.json({ success: true, username: userData.username || username })
  } catch (e) {
    console.error('Login error:', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleRegister(request: NextRequest) {
  let username: string | undefined
  let password: string | undefined
  try {
    const body = await request.json()
    username = body.username
    password = body.password
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!username || !password) {
    return Response.json({ error: 'Username and password required' }, { status: 400 })
  }

  if (username.length < 3 || username.length > 20) {
    return Response.json({ error: 'Username must be 3-20 characters' }, { status: 400 })
  }

  if (password.length < 4) {
    return Response.json({ error: 'Password must be at least 4 characters' }, { status: 400 })
  }

  const normalizedUsername = username.toLowerCase()
  const usersKey = 'users'

  try {
    const existingUser = await redis.hget(usersKey, normalizedUsername)

    if (existingUser) {
      return Response.json({ error: 'Username already exists' }, { status: 409 })
    }

    const passwordSalt = generateSalt()
    const userData = {
      username: username,
      passwordSalt: passwordSalt,
      passwordHash: hashPassword(password, passwordSalt),
      createdAt: Date.now(),
    }

    await redis.hset(usersKey, { [normalizedUsername]: JSON.stringify(userData) })

    return Response.json({ success: true, username })
  } catch (e) {
    console.error('Register error:', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
