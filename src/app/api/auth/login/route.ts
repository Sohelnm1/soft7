import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
  
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    const trimmedEmail = String(email || "").toLowerCase().trim()
    const trimmedPassword = String(password || "").trim()

    const fieldErrors: Record<string, string> = {}

    // ✅ Validate fields
    if (!trimmedEmail) fieldErrors.email = "Email is required"
    if (!trimmedPassword) fieldErrors.password = "Password is required"

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        { error: "Fix the errors", fieldErrors },
        { status: 400 }
      )
    }

    // ✅ Check user exists
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // ✅ Check password match
    const isValid = await bcrypt.compare(trimmedPassword, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // ✅ Create token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

    // ✅ Response
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email },
    })

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    })

    return response

  } catch (error) {
    console.error("❌ Login error:", error)
    return NextResponse.json(
      { error: "Server error, try again later" },
      { status: 500 }
    )
  }
}
