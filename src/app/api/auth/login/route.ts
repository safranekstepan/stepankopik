import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  if (!process.env.APP_PASSWORD) {
    return NextResponse.json({ error: 'Server misconfigured.' }, { status: 500 })
  }

  const a = Buffer.from(password.trim())
  const b = Buffer.from(process.env.APP_PASSWORD.trim())
  const match = a.length === b.length && timingSafeEqual(a, b)

  if (!match) {
    return NextResponse.json({ error: 'Nesprávné heslo.' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('session', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return response
}
