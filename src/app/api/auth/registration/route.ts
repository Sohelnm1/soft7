import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { parsePhoneNumber, getCountries, getCountryCallingCode } from 'libphonenumber-js/max'
import type { CountryCode } from 'libphonenumber-js/max'
 
const EMAILABLE_API_KEY = process.env.EMAILABLE_API_KEY
 
export async function POST(req: Request) {
  try {
    const { name, email, phone, password, countryCode } = await req.json()
 
    const trimmedName = String(name || '').trim()
    const lowerEmail = String(email || '').toLowerCase().trim()
    const trimmedPhone = String(phone || '').trim()
    const inputCode = String(countryCode || '').trim()
    const trimmedPassword = String(password || '').trim()
 
    const fieldErrors: Record<string, string> = {}
 
    // ✅ Convert +91 → IN / +971 → AE / +1 → US
    let rawCountryCode: CountryCode | undefined
    if (inputCode.startsWith("+")) {
      const dial = inputCode.replace("+", "")
      rawCountryCode = getCountries().find(
        c => getCountryCallingCode(c) === dial
      ) as CountryCode | undefined
    } else rawCountryCode = inputCode.toUpperCase() as CountryCode
 
    // ✅ Global empty check
    if (!trimmedName && !lowerEmail && !trimmedPhone && !inputCode && !trimmedPassword) {
      return NextResponse.json({
        error: "Please fill all required fields",
        fieldErrors: {
          name: "Name is required",
          email: "Email is required",
          phone: "Phone is required",
          countryCode: "Country code is required",
          password: "Password is required",
        }
      }, { status: 400 })
    }
 
    // ✅ Individual validations
    if (!trimmedName) fieldErrors.name = "Name is required"
    else if (trimmedName.length < 2) fieldErrors.name = "Name must be at least 2 characters"
 
    if (!lowerEmail) fieldErrors.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lowerEmail)) {
      fieldErrors.email = "Invalid email format"
    } else {
      // ✅ Emailable verification
      const verifyRes = await fetch(`https://api.emailable.com/v1/verify?email=${lowerEmail}`, {
        headers: {
          Authorization: `Bearer ${EMAILABLE_API_KEY}`
        }
      })
      const verifyData = await verifyRes.json()
      if (verifyData.state !== 'deliverable') {
        fieldErrors.email = "Email ID does not exist or is undeliverable"
      }
    }
 
    if (!inputCode) fieldErrors.countryCode = "Country code is required"
    if (!rawCountryCode) fieldErrors.countryCode = "Invalid country code"
 
    if (!trimmedPhone) fieldErrors.phone = "Phone number is required"
    else if (rawCountryCode) {
      try {
        const pn = parsePhoneNumber(trimmedPhone, rawCountryCode)
        if (!pn?.isValid()) fieldErrors.phone = `Invalid phone for ${rawCountryCode}`
      } catch {
        fieldErrors.phone = "Invalid phone format"
      }
    }
 
    // ✅ Strong password rule (backend)
    if (!trimmedPassword) fieldErrors.password = "Password is required"
    else if (trimmedPassword.length < 8) fieldErrors.password = "Min 8 characters required"
    else {
      const hasUpper = /[A-Z]/.test(trimmedPassword)
      const hasLower = /[a-z]/.test(trimmedPassword)
      const hasNumber = /[0-9]/.test(trimmedPassword)
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(trimmedPassword)
      if (!hasUpper || !hasLower || !hasNumber || !hasSpecial)
        fieldErrors.password = "Must include uppercase, lowercase, number & special character"
    }
 
    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json({ error: "Fix the errors", fieldErrors }, { status: 400 })
    }
 
    // ✅ Format number
    const pn = parsePhoneNumber(trimmedPhone, rawCountryCode as CountryCode)
    const fullPhoneNumber = pn!.number
 
    // ✅ Check duplicates
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: lowerEmail }, { phone: fullPhoneNumber }] }
    })
 
    if (existingUser) {
      const dup: Record<string, string> = {}
      if (existingUser.email === lowerEmail) dup.email = "Email already exists"
      if (existingUser.phone === fullPhoneNumber) dup.phone = "Phone already exists"
 
      return NextResponse.json({
        error: "User already exists",
        fieldErrors: dup
      }, { status: 409 })
    }
 
    // ✅ Save user
    const hashedPassword = await bcrypt.hash(trimmedPassword, 10)
    const user = await prisma.user.create({
      data: {
        name: trimmedName,
        email: lowerEmail,
        phone: fullPhoneNumber,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        memberSince: true,
      },
    })
 
    return NextResponse.json(
      { success: true, message: "Registration successful", user },
      { status: 201 }
    )
 
  } catch (err) {
    console.error("Registration error:", err)
    return NextResponse.json({
      error: "Server error, try again later"
    }, { status: 500 })
  }
}
 
 