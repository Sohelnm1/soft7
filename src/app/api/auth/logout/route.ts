import { NextResponse } from 'next/server'
import { serialize } from 'cookie'

export async function POST() {
  const res = NextResponse.json({ message: 'Logged out successfully' })
  
  res.headers.set(
    'Set-Cookie',
    serialize('token', '', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
    })
  )
  
  return res
}
