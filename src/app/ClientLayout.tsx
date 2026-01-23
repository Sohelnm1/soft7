'use client'

import { Sidebar } from '@/components/sidebar'
import { Topbar } from '@/components/topbar'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isReady, setIsReady] = useState(false)
  const [isAuthPage, setIsAuthPage] = useState(true)

  useEffect(() => {
    if (pathname) {
      const authRoutes = ['/', '/login', '/signup', '/auth']
      setIsAuthPage(authRoutes.includes(pathname))
      setIsReady(true)
    }
  }, [pathname])

  if (!isReady) return null

  return (
    <>
      {isAuthPage ? (
        <div className="flex items-center justify-center h-screen bg-gray-50">
          {children}
        </div>
      ) : (
        <div className="flex h-screen">
          <Sidebar />

          {/* ✅ ADDED id="app-main" */}
          <main id="app-main" className="flex-1 flex flex-col">
            <Topbar />
            <div className="p-6 overflow-y-auto">{children}</div>
          </main>
        </div>
      )}
      <Toaster position="top-center" reverseOrder={false} />
    </>
  )
}
