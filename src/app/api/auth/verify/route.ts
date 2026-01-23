import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ valid: false }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      return NextResponse.json({ valid: true, user: decoded })
    } catch (err) {
      return NextResponse.json({ valid: false }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ valid: false }, { status: 500 })
  }
}