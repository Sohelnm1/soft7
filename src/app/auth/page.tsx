'use client'

import { useState } from 'react'
import { Phone, Lock, User, Mail, Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [isRegisterActive, setIsRegisterActive] = useState(false)
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({})
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({})
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const router = useRouter()

  const COUNTRY_CODES: { code: string; name: string }[] = [
    { code: '+1', name: 'United States / Canada' },
    { code: '+91', name: 'India' },
    { code: '+44', name: 'United Kingdom' },
    { code: '+971', name: 'United Arab Emirates' },
  ]

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoginErrors({})
    
    const form = new FormData(e.currentTarget)
    const email = form.get('email')
    const password = form.get('password')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      const data = await res.json()

      if (res.ok && data.success) {
        await new Promise(res => setTimeout(res, 50))
        router.replace('/dashboard')
      } else {
        if (data.fieldErrors) {
          setLoginErrors(data.fieldErrors)
        } else {
          setLoginErrors({ general: data.error || 'Login failed' })
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      setLoginErrors({ general: 'An error occurred during login' })
    }
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setRegisterErrors({})
    
    const form = new FormData(e.currentTarget)
    const name = form.get('name')
    const email = form.get('email')
    const countryCode = form.get('countryCode')
    const phone = form.get('phone')
    const password = form.get('password')
    const passwordStr= String(password)
    const passwordValid= /^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,}$/.test(passwordStr)
    if(!passwordValid){
      setRegisterErrors({password:'password must be 8+chars, include upper, lower, and special character'})
      return
    }
    try {
      const res = await fetch('/api/auth/registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, countryCode }),
      })

      const data = await res.json()

      if (res.ok) {
        alert('Registered successfully! Please login.')
        setIsRegisterActive(false)
        setRegisterErrors({})
      } else {
        if (data.fieldErrors) {
          setRegisterErrors(data.fieldErrors)
        } else {
          setRegisterErrors({ general: data.error || 'Registration failed' })
        }
      }
    } catch (error) {
      console.error('Registration error:', error)
      setRegisterErrors({ general: 'An error occurred during registration' })
    }
  }

  const clearFieldError = (form: 'login' | 'register', field: string) => {
    if (form === 'login') {
      setLoginErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    } else {
      setRegisterErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const isPhoneError = registerErrors.countryCode || registerErrors.phone

  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        fontFamily: "'Poppins', sans-serif",
        width: '100%',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #065f46 0%, #064e3b 50%, #022c22 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxSizing: 'border-box',
        transition: 'background 1s ease',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '1000px',
          height: '600px',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '20px',
          backdropFilter: 'blur(25px)',
          boxShadow: '0 8px 40px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          display: 'flex',
          overflow: 'hidden',
          transition: '1s ease-in-out',
        }}
      >
        {/* Animated background shapes */}
        <div
          style={{
            position: 'absolute',
            width: '700px',
            height: '700px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))',
            top: '-350px',
            right: isRegisterActive ? '50%' : '-300px',
            transform: isRegisterActive ? 'translateX(50%)' : 'none',
            transition: '1.5s ease-in-out',
          }}
        ></div>

        <div
          style={{
            position: 'absolute',
            width: '700px',
            height: '700px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(5, 150, 105, 0.03))',
            bottom: '-350px',
            left: isRegisterActive ? '50%' : '-300px',
            transform: isRegisterActive ? 'translateX(-50%)' : 'none',
            transition: '1.5s ease-in-out',
          }}
        ></div>

        {/* LOGIN FORM */}
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'column',
            width: '50%',
            height: '100%',
            left: 0,
            padding: '0 70px 0 50px',
            pointerEvents: isRegisterActive ? 'none' : 'all',
            zIndex: 2,
          }}
        >
          <h2
            style={{
              fontSize: '38px',
              color: '#fff',
              textAlign: 'center',
              marginBottom: '25px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              transition: '0.5s',
              transform: isRegisterActive ? 'translateX(-100%)' : 'translateX(0)',
              opacity: isRegisterActive ? 0 : 1,
              filter: isRegisterActive ? 'blur(10px)' : 'blur(0)',
            }}
          >
            Login
          </h2>

          {loginErrors.general && (
            <div style={{
              color: '#ff4444',
              fontSize: '13px',
              marginBottom: '12px',
              padding: '8px',
              background: 'rgba(255, 68, 68, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 68, 68, 0.3)',
            }}>
              ⚠️ {loginErrors.general}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ position: 'relative', width: '100%', margin: '15px 0', transition: '0.5s 0.1s', transform: isRegisterActive ? 'translateX(-100%)' : 'translateX(0)', opacity: isRegisterActive ? 0 : 1, filter: isRegisterActive ? 'blur(10px)' : 'blur(0)' }}>
              <input
                type="email"
                name="email"
                required
                placeholder="Email"
                onChange={() => clearFieldError('login', 'email')}
                style={{
                  width: '100%',
                  height: '50px',
                  background: 'transparent',
                  border: `2px solid ${loginErrors.email ? '#ff4444' : 'rgba(255,255,255,0.3)'}`,
                  borderRadius: '40px',
                  fontSize: '16px',
                  color: '#fff',
                  padding: '0 45px 0 20px',
                  outline: 'none',
                  transition: 'border-color 0.3s ease',
                }}
                onFocus={(e) => {
                  if (!loginErrors.email) {
                    e.target.style.borderColor = 'rgba(16, 185, 129, 0.6)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                  }
                }}
                onBlur={(e) => {
                  if (!loginErrors.email) {
                    e.target.style.borderColor = 'rgba(255,255,255,0.3)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              />
              <Mail
                style={{
                  position: 'absolute',
                  right: '20px',
                  top: '15px',
                  color: 'rgba(255,255,255,0.7)',
                }}
                size={20}
              />
              {loginErrors.email && (
                <p style={{ color: '#ff4444', fontSize: '12px', marginTop: '4px', marginLeft: '10px' }}>
                  ⚠️ {loginErrors.email}
                </p>
              )}
            </div>

           <div style={{ position: 'relative', width: '100%', margin: '15px 0', transition: '0.5s 0.2s', transform: isRegisterActive ? 'translateX(-100%)' : 'translateX(0)', opacity: isRegisterActive ? 0 : 1, filter: isRegisterActive ? 'blur(10px)' : 'blur(0)' }}>
      <input
        type={showLoginPassword ? 'text' : 'password'}
        name="password"
        required
        placeholder="Password"
        onChange={() => clearFieldError('login', 'password')}
        style={{
          width: '100%',
          height: '50px',
          background: 'transparent',
          border: `2px solid ${loginErrors.password ? '#ff4444' : 'rgba(255,255,255,0.3)'}`,
          borderRadius: '40px',
          fontSize: '16px',
          color: '#fff',
          padding: '0 45px 0 20px',
          outline: 'none',
          transition: 'border-color 0.3s ease',
        }}
        onFocus={(e) => {
          if (!loginErrors.password) {
            e.target.style.borderColor = 'rgba(16, 185, 129, 0.6)';
            e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
          }
        }}
        onBlur={(e) => {
          if (!loginErrors.password) {
            e.target.style.borderColor = 'rgba(255,255,255,0.3)';
            e.target.style.boxShadow = 'none';
          }
        }}
      />
      <div style={{ position: 'absolute', right: '20px', top: '15px', display: 'flex', gap: '8px' }}>
        <Lock size={20} style={{ color: 'rgba(255,255,255,0.7)' }} />
        {showLoginPassword ? (
          <Eye
            size={20}
            style={{ color: 'rgba(16, 185, 129, 0.8)', cursor: 'pointer' }}
            onClick={() => setShowLoginPassword(false)}
          />
        ) : (
          <EyeOff
            size={20}
            style={{ color: 'rgba(16, 185, 129, 0.8)', cursor: 'pointer' }}
            onClick={() => setShowLoginPassword(true)}
          />
        )}
      </div>
      {loginErrors.password && (
        <p style={{ color: '#ff4444', fontSize: '12px', marginTop: '4px', marginLeft: '10px' }}>
          ⚠️ {loginErrors.password}
        </p>
      )}
    </div>

            <div
              style={{
                width: '100%',
                marginTop: '15px',
                transition: '0.5s 0.3s',
                transform: isRegisterActive ? 'translateX(-100%)' : 'translateX(0)',
                opacity: isRegisterActive ? 0 : 1,
              }}
            >
              <button
                type="submit"
                style={{
                  width: '100%',
                  height: '48px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '40px',
                  cursor: 'pointer',
                  fontSize: '17px',
                  fontWeight: 600,
                  color: '#fff',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  transition: '0.3s',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                }}
              >
                Login
              </button>
            </div>

            <div
              style={{
                textAlign: 'center',
                marginTop: '18px',
                transition: '0.5s 0.4s',
                transform: isRegisterActive ? 'translateX(-100%)' : 'translateX(0)',
                opacity: isRegisterActive ? 0 : 1,
              }}
            >
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)' }}>
                Don&apos;t have an account?{' '}
                <span
                  onClick={(e) => {
                    e.preventDefault()
                    setIsRegisterActive(true)
                    setLoginErrors({})
                  }}
                  style={{
                    color: '#fff',
                    fontWeight: 700,
                    textDecoration: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Sign Up
                </span>
              </p>
            </div>
          </form>
        </div>

        {/* LOGIN INFO */}
        <div
          style={{
            position: 'absolute',
            width: '50%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'column',
            right: 0,
            textAlign: 'right',
            padding: '0 50px 0 70px',
            zIndex: 1,
          }}
        >
          <h2
            style={{
              fontSize: '42px',
              color: '#fff',
              lineHeight: 1.2,
              textTransform: 'uppercase',
              marginBottom: '20px',
              fontWeight: 800,
              letterSpacing: '3px',
              transform: isRegisterActive ? 'translateX(100%)' : 'translateX(0)',
              opacity: isRegisterActive ? 0 : 1,
              filter: isRegisterActive ? 'blur(10px)' : 'blur(0)',
              transition: '0.5s',
            }}
          >
            Welcome Back!
          </h2>
          <p
            style={{
              fontSize: '17px',
              color: 'rgba(255,255,255,0.9)',
              lineHeight: 1.7,
              transition: '0.5s 0.1s',
              transform: isRegisterActive ? 'translateX(100%)' : 'translateX(0)',
              opacity: isRegisterActive ? 0 : 1,
              filter: isRegisterActive ? 'blur(10px)' : 'blur(0)',
            }}
          >
            We&apos;re happy to see you again. Let&apos;s continue your journey.
          </p>
        </div>

        {/* REGISTER FORM */}
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'column',
            width: '50%',
            height: '100%',
            right: 0,
            padding: '0 50px 0 70px',
            pointerEvents: isRegisterActive ? 'all' : 'none',
            zIndex: 2,
          }}
        >
          <h2
            style={{
              fontSize: '38px',
              color: '#fff',
              textAlign: 'center',
              marginBottom: '20px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              transition: '0.5s',
              transform: isRegisterActive ? 'translateX(0)' : 'translateX(100%)',
              opacity: isRegisterActive ? 1 : 0,
              filter: isRegisterActive ? 'blur(0)' : 'blur(10px)',
            }}
          >
            Register
          </h2>

          {registerErrors.general && (
            <div style={{
              color: '#ff4444',
              fontSize: '13px',
              marginBottom: '10px',
              padding: '8px',
              background: 'rgba(255, 68, 68, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 68, 68, 0.3)',
            }}>
              ⚠️ {registerErrors.general}
            </div>
          )}

          <form onSubmit={handleRegister}>
            {/* Name Field */}
            <div style={{ position: 'relative', width: '100%', margin: '12px 0', transition: '0.5s 0.1s', transform: isRegisterActive ? 'translateX(0)' : 'translateX(100%)', opacity: isRegisterActive ? 1 : 0, filter: isRegisterActive ? 'blur(0)' : 'blur(10px)' }}>
              <input
                type="text"
                name="name"
                required
                placeholder="Full Name"
                onChange={() => clearFieldError('register', 'name')}
                style={{
                  width: '100%',
                  height: '48px',
                  background: 'transparent',
                  border: `2px solid ${registerErrors.name ? '#ff4444' : 'rgba(255,255,255,0.3)'}`,
                  borderRadius: '40px',
                  fontSize: '16px',
                  color: '#fff',
                  padding: '0 45px 0 20px',
                  outline: 'none',
                  transition: 'border-color 0.3s ease',
                }}
                onFocus={(e) => {
                  if (!registerErrors.name) {
                    e.target.style.borderColor = 'rgba(16, 185, 129, 0.6)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                  }
                }}
                onBlur={(e) => {
                  if (!registerErrors.name) {
                    e.target.style.borderColor = 'rgba(255,255,255,0.3)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              />
              <User
                style={{
                  position: 'absolute',
                  right: '20px',
                  top: '14px',
                  color: 'rgba(255,255,255,0.7)',
                }}
                size={20}
              />
              {registerErrors.name && (
                <p style={{ color: '#ff4444', fontSize: '11px', marginTop: '3px', marginLeft: '10px' }}>
                  ⚠️ {registerErrors.name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div style={{ position: 'relative', width: '100%', margin: '12px 0', transition: '0.5s 0.15s', transform: isRegisterActive ? 'translateX(0)' : 'translateX(100%)', opacity: isRegisterActive ? 1 : 0, filter: isRegisterActive ? 'blur(0)' : 'blur(10px)' }}>
              <input
                type="email"
                name="email"
                required
                placeholder="Email"
                onChange={() => clearFieldError('register', 'email')}
                style={{
                  width: '100%',
                  height: '48px',
                  background: 'transparent',
                  border: `2px solid ${registerErrors.email ? '#ff4444' : 'rgba(255,255,255,0.3)'}`,
                  borderRadius: '40px',
                  fontSize: '16px',
                  color: '#fff',
                  padding: '0 45px 0 20px',
                  outline: 'none',
                  transition: 'border-color 0.3s ease',
                }}
                onFocus={(e) => {
                  if (!registerErrors.email) {
                    e.target.style.borderColor = 'rgba(16, 185, 129, 0.6)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                  }
                }}
                onBlur={(e) => {
                  if (!registerErrors.email) {
                    e.target.style.borderColor = 'rgba(255,255,255,0.3)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              />
              <Mail
                style={{
                  position: 'absolute',
                  right: '20px',
                  top: '14px',
                  color: 'rgba(255,255,255,0.7)',
                }}
                size={20}
              />
              {registerErrors.email && (
                <p style={{ color: '#ff4444', fontSize: '11px', marginTop: '3px', marginLeft: '10px' }}>
                  ⚠️ {registerErrors.email}
                </p>
              )}
            </div>

            {/* Combined Country Code and Phone Field */}
            <div 
                style={{ 
                    width: '100%', 
                    margin: '12px 0', 
                    transition: '0.5s 0.2s', 
                    transform: isRegisterActive ? 'translateX(0)' : 'translateX(100%)', 
                    opacity: isRegisterActive ? 1 : 0, 
                    filter: isRegisterActive ? 'blur(0)' : 'blur(10px)' 
                }}
            >
                <div style={{ position: 'relative', width: '100%', display: 'flex' }}>
                    <input
                        type="text"
                        name="countryCode"
                        list="countryCodes"
                        required
                        defaultValue="+91"
                        placeholder="Code"
                        onChange={() => {
                          clearFieldError('register', 'countryCode')
                          clearFieldError('register', 'phone')
                        }}
                        style={{
                          width: '30%',
                          maxWidth: '95px',
                          height: '48px',
                          background: 'transparent',
                          border: `2px solid ${registerErrors.countryCode ? '#ff4444' : 'rgba(255,255,255,0.3)'}`,
                          borderRadius: '40px 0 0 40px',
                          fontSize: '16px',
                          color: '#fff',
                          padding: '0 8px',
                          outline: 'none',
                          textAlign: 'center',
                          borderRight: 'none',
                          transition: 'border-color 0.3s ease',
                        }}
                        onFocus={(e) => {
                          if (!registerErrors.countryCode) {
                            e.target.style.borderColor = 'rgba(16, 185, 129, 0.6)';
                            e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                          }
                        }}
                        onBlur={(e) => {
                          if (!registerErrors.countryCode) {
                            e.target.style.borderColor = 'rgba(255,255,255,0.3)';
                            e.target.style.boxShadow = 'none';
                          }
                        }}
                    />
                    <datalist id="countryCodes">
                        {COUNTRY_CODES.map(({ code, name }) => (
                          <option key={code} value={code} label={`${name} (${code})`}></option>
                        ))}
                    </datalist>

                    <input
                        type="tel"
                        name="phone"
                        required
                        placeholder="Phone Number"
                        onChange={() => {
                          clearFieldError('register', 'countryCode')
                          clearFieldError('register', 'phone')
                        }}
                        style={{
                          flexGrow: 1,
                          height: '48px',
                          background: 'transparent',
                          border: `2px solid ${registerErrors.phone ? '#ff4444' : 'rgba(255,255,255,0.3)'}`,
                          borderRadius: '0 40px 40px 0',
                          fontSize: '16px',
                          color: '#fff',
                          padding: '0 45px 0 15px',
                          outline: 'none',
                          borderLeft: 'none',
                          transition: 'border-color 0.3s ease',
                        }}
                        onFocus={(e) => {
                          if (!registerErrors.phone) {
                            e.target.style.borderColor = 'rgba(16, 185, 129, 0.6)';
                            e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                          }
                        }}
                        onBlur={(e) => {
                          if (!registerErrors.phone) {
                            e.target.style.borderColor = 'rgba(255,255,255,0.3)';
                            e.target.style.boxShadow = 'none';
                          }
                        }}
                    />
                    <Phone
                      style={{
                        position: 'absolute',
                        right: '20px',
                        top: '14px',
                        color: 'rgba(255,255,255,0.7)',
                      }}
                      size={20}
                    />
                </div>
                
                {registerErrors.countryCode && (
                    <p style={{ color: '#ff4444', fontSize: '11px', marginTop: '3px', marginLeft: '10px' }}>
                        ⚠️ Country Code: {registerErrors.countryCode}
                    </p>
                )}
                {registerErrors.phone && (
                    <p style={{ color: '#ff4444', fontSize: '11px', marginTop: '3px', marginLeft: '10px' }}>
                        ⚠️ Phone: {registerErrors.phone}
                    </p>
                )}
            </div>

           {/* Password Field */}
<div style={{
  position: 'relative',
  width: '100%',
  margin: '12px 0',
  transition: '0.5s 0.25s',
  transform: isRegisterActive ? 'translateX(0)' : 'translateX(100%)',
  opacity: isRegisterActive ? 1 : 0,
  filter: isRegisterActive ? 'blur(0)' : 'blur(10px)'
}}>
  <input
    type={showRegisterPassword ? 'text' : 'password'}
    name="password"
    required
    placeholder="Password"
    onChange={() => clearFieldError('register', 'password')}
    style={{
      width: '100%',
      height: '48px',
      background: 'transparent',
      border: `2px solid ${registerErrors.password ? '#ff4444' : 'rgba(255,255,255,0.3)'}`,
      borderRadius: '40px',
      fontSize: '16px',
      color: '#fff',
      padding: '0 45px 0 20px',
      outline: 'none',
      transition: 'border-color 0.3s ease',
    }}
    onFocus={(e) => {
      if (!registerErrors.password) {
        e.target.style.borderColor = 'rgba(16, 185, 129, 0.6)';
        e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
      }
    }}
    onBlur={(e) => {
      if (!registerErrors.password) {
        e.target.style.borderColor = 'rgba(255,255,255,0.3)';
        e.target.style.boxShadow = 'none';
      }
    }}
  />
  <div style={{
    position: 'absolute',
    right: '20px',
    top: '14px',
    display: 'flex',
    gap: '8px'
  }}>
    <Lock size={20} style={{ color: 'rgba(255,255,255,0.7)' }} />
    {showRegisterPassword ? (
      <Eye
        size={20}
        style={{ color: 'rgba(16, 185, 129, 0.8)', cursor: 'pointer' }}
        onClick={() => setShowRegisterPassword(false)}
      />
    ) : (
      <EyeOff
        size={20}
        style={{ color: 'rgba(16, 185, 129, 0.8)', cursor: 'pointer' }}
        onClick={() => setShowRegisterPassword(true)}
      />
    )}
  </div>
  {registerErrors.password && (
    <p style={{
      color: '#ff4444',
      fontSize: '11px',
      marginTop: '3px',
      marginLeft: '10px'
    }}>
      ⚠️ {registerErrors.password}
    </p>
  )}
</div>

  
            <div
              style={{
                width: '100%',
                marginTop: '12px',
                transition: '0.5s 0.3s',
                transform: isRegisterActive ? 'translateX(0)' : 'translateX(100%)',
                opacity: isRegisterActive ? 1 : 0,
              }}
            >
              <button
                type="submit"
                style={{
                  width: '100%',
                  height: '48px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '40px',
                  cursor: 'pointer',
                  fontSize: '17px',
                  fontWeight: 600,
                  color: '#fff',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  transition: '0.3s',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                }}
              >
                Register
              </button>
            </div>

            <div
              style={{
                textAlign: 'center',
                marginTop: '12px',
                transition: '0.5s 0.35s',
                transform: isRegisterActive ? 'translateX(0)' : 'translateX(100%)',
                opacity: isRegisterActive ? 1 : 0,
              }}
            >
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)' }}>
                Already have an account?{' '}
                <span
                  onClick={(e) => {
                    e.preventDefault()
                    setIsRegisterActive(false)
                    setRegisterErrors({})
                  }}
                  style={{
                    color: '#fff',
                    fontWeight: 700,
                    textDecoration: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Login
                </span>
              </p>
            </div>
          </form>
        </div>

        {/* REGISTER INFO */}
        <div
          style={{
            position: 'absolute',
            width: '50%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'column',
            left: 0,
            textAlign: 'left',
            padding: '0 70px 0 50px',
            zIndex: 1,
          }}
        >
          <h2
            style={{
              fontSize: '42px',
              color: '#fff',
              lineHeight: 1.2,
              textTransform: 'uppercase',
              marginBottom: '20px',
              fontWeight: 800,
              letterSpacing: '3px',
              transform: isRegisterActive ? 'translateX(0)' : 'translateX(-100%)',
              opacity: isRegisterActive ? 1 : 0,
              filter: isRegisterActive ? 'blur(0)' : 'blur(10px)',
              transition: '0.5s',
            }}
          >
            Welcome!
          </h2>
          <p
            style={{
              fontSize: '17px',
              color: 'rgba(255,255,255,0.9)',
              lineHeight: 1.7,
              transition: '0.5s 0.1s',
              transform: isRegisterActive ? 'translateX(0)' : 'translateX(-100%)',
              opacity: isRegisterActive ? 1 : 0,
              filter: isRegisterActive ? 'blur(0)' : 'blur(10px)',
            }}
          >
            We&apos;re delighted to have you here. Start your journey with us today!
          </p>
        </div>
      </div>
    </div>
  )
}