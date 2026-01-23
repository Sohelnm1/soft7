"use client";

import { useState, useEffect } from "react"
import { Trash2, UserPlus, Mail, Phone, Shield, Users, Crown, Eye, AlertCircle } from "lucide-react"

interface TeamMember {
  id: number;
  userId?: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  image?: string;
  isYou?: boolean;
}

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("+91")
  const [role, setRole] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [isDark, setIsDark] = useState(false)

  // Watch theme changes
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }
    
    checkTheme()
    
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [])

  // Fetch team members on load
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setFetching(true)
        const res = await fetch("/api/team", { credentials: "include" })
        const data = await res.json()

        if (res.ok && data.teamMembers) {
          const membersWithYou = data.teamMembers.map((m: TeamMember) => ({
            ...m,
            isYou: data.admin?.id === m.userId,
          }))
          setTeamMembers(membersWithYou)
        } else {
          console.error("❌ Failed to load team members:", data.error)
        }
      } catch (error) {
        console.error("❌ Error fetching team members:", error)
      } finally {
        setFetching(false)
      }
    }
    fetchTeamMembers()
  }, [])

  const handleAddMember = async () => {
    if (!email.trim() || !role) {
      alert("Please fill all required fields before inviting.")
      return
    }

    try {
      setLoading(true)
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, phone, role }),
      })

      const data = await res.json()

      if (res.ok) {
        alert("✅ Member invited successfully!")
        const newMember: TeamMember = {
          id: data.member.id,
          userId: data.member.userId,
          name: data.member.name,
          email: data.member.email,
          phone: data.member.phone,
          role: data.member.role,
          image: data.member.image,
          isYou: false,
        }
        setTeamMembers((prev) => [...prev, newMember])
        setEmail("")
        setPhone("+91")
        setRole("")
      } else {
        alert(`❌ Failed to invite: ${data.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("❌ Error adding member:", error)
      alert("Failed to invite member. Check console for details.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMember = async (id: number, memberRole: string) => {
    if (memberRole === "ADMIN") {
      alert("Cannot delete an Admin!")
      return
    }

    if (!confirm("Are you sure you want to remove this member?")) return

    try {
      const res = await fetch("/api/team", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id }),
      })

      if (res.ok) {
        setTeamMembers((prev) => prev.filter((m) => m.id !== id))
        alert("✅ Member deleted successfully")
      } else {
        const err = await res.json()
        alert(err.error || "Failed to delete member")
      }
    } catch (error) {
      console.error("❌ Error deleting member:", error)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role?.toUpperCase()) {
      case "ADMIN":
        return "from-green-500 to-emerald-500"
      case "MEMBER":
        return "from-green-600 to-teal-600"
      case "VIEWER":
        return "from-green-400 to-cyan-400"
      default:
        return "from-green-300 to-emerald-300"
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role?.toUpperCase()) {
      case "ADMIN":
        return <Crown className="w-4 h-4" />
      case "MEMBER":
        return <Users className="w-4 h-4" />
      case "VIEWER":
        return <Eye className="w-4 h-4" />
      default:
        return <Shield className="w-4 h-4" />
    }
  }

  return (
    <div 
      className="w-full min-h-screen p-8 overflow-auto transition-colors duration-300"
      style={{background: isDark ? '#0f1629' : '#f8fafc'}}
    >
      <div className="max-w-[90rem] mx-auto space-y-6">
        {/* Header Card */}
        <div 
          className="rounded-2xl shadow-xl overflow-hidden relative transition-colors duration-300"
          style={{
            background: isDark ? '#0f1629' : '#ffffff',
            border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`
          }}
        >
          {/* Gradient Banner */}
          <div 
            className="h-[240px] rounded-t-2xl relative shadow-[0_0_40px_-8px_rgba(99,102,241,0.6)]"
            style={{background: 'linear-gradient(to right, #0A1D56, #1B3C73, #5C2FC2)'}}
          >
            <div 
              className="absolute inset-0 opacity-10"
              style={{backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMSI+PHBhdGggZD0iTTM2IDM0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wIDEwYzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00eiIvPjwvZz48L2c+PC9zdmc+')"}}
            ></div>
          </div>

          {/* Content below banner */}
          <div className="px-8 pb-8 -mt-8 relative z-10">
            <div className="flex items-end gap-6">
              {/* Logo Box */}
              <div 
                className="w-28 h-28 rounded-2xl flex items-center justify-center shadow-xl ring-4 transition-colors duration-300"
                style={{
                  background: isDark ? '#1a2235' : '#f3f4f6',
                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                  ringColor: isDark ? '#0f1629' : '#ffffff'
                }}
              >
                <Users className="w-14 h-14 text-green-400" />
              </div>

              {/* Text beside logo */}
              <div className="pb-1">
                <h1 
                  className="text-3xl font-bold transition-colors duration-300"
                  style={{color: isDark ? '#ffffff' : '#111827'}}
                >
                  Team Management
                </h1>
                <p 
                  className="transition-colors duration-300"
                  style={{color: isDark ? '#9ca3af' : '#4b5563'}}
                >
                  Manage, invite, and view team members
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Invite Form Card */}
        <div 
          className="rounded-2xl shadow-xl p-8 transition-colors duration-300"
          style={{
            background: isDark ? '#0f1629' : '#ffffff',
            border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`
          }}
        >
          {/* Info Banner */}
          <div 
            className="mb-8 p-4 rounded-xl transition-colors duration-300"
            style={{
              background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgb(239, 246, 255)',
              border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgb(191, 219, 254)'}`
            }}
          >
            <div className="flex items-start gap-3">
              <AlertCircle 
                className="w-5 h-5 flex-shrink-0 mt-0.5 transition-colors duration-300"
                style={{color: isDark ? '#60a5fa' : '#2563eb'}}
              />
              <div>
                <p 
                  className="font-bold text-sm transition-colors duration-300"
                  style={{color: isDark ? '#93c5fd' : '#1d4ed8'}}
                >
                  Invite Team Members
                </p>
                <p 
                  className="text-sm mt-0.5 transition-colors duration-300"
                  style={{color: isDark ? 'rgba(147, 197, 253, 0.8)' : '#2563eb'}}
                >
                  Add new team members by providing their email, phone, and role. Invited members will receive access immediately.
                </p>
              </div>
            </div>
          </div>

          <h2 
            className="text-xl font-bold flex items-center gap-3 mb-6 transition-colors duration-300"
            style={{color: isDark ? '#ffffff' : '#111827'}}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            Invite New Members
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label
                className="text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-colors duration-300"
                style={{color: isDark ? '#9ca3af' : '#4b5563'}}
              >
                <Mail className="w-4 h-4 text-green-400" />
                Email
                <span 
                  className="transition-colors duration-300"
                  style={{color: isDark ? '#f87171' : '#dc2626'}}
                >
                  *
                </span>
              </label>
              <input
                type="email"
                placeholder="member@example.com"
                className="w-full px-4 py-3 rounded-lg outline-none transition-all duration-200"
                style={{
                  background: isDark ? '#1a2235' : '#f9fafb',
                  border: `1px solid ${isDark ? '#374151' : '#d1d5db'}`,
                  color: isDark ? '#ffffff' : '#111827'
                }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label 
                className="text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-colors duration-300"
                style={{color: isDark ? '#9ca3af' : '#4b5563'}}
              >
                <Phone className="w-4 h-4 text-green-400" />
                Phone
              </label>
              <input
                type="text"
                placeholder="+91"
                className="w-full px-4 py-3 rounded-lg outline-none transition-all duration-200"
                style={{
                  background: isDark ? '#1a2235' : '#f9fafb',
                  border: `1px solid ${isDark ? '#374151' : '#d1d5db'}`,
                  color: isDark ? '#ffffff' : '#111827'
                }}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label 
                className="text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-colors duration-300"
                style={{color: isDark ? '#9ca3af' : '#4b5563'}}
              >
                <Shield className="w-4 h-4 text-pink-400" />
                Role
                <span 
                  className="transition-colors duration-300"
                  style={{color: isDark ? '#f87171' : '#dc2626'}}
                >
                  *
                </span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 rounded-lg outline-none transition-all duration-200"
                style={{
                  background: isDark ? '#1a2235' : '#f9fafb',
                  border: `1px solid ${isDark ? '#374151' : '#d1d5db'}`,
                  color: isDark ? '#ffffff' : '#111827'
                }}
                disabled={loading}
              >
                <option value="">Select role</option>
                <option value="ADMIN">ADMIN</option>
                <option value="MEMBER">MEMBER</option>
                <option value="VIEWER">VIEWER</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleAddMember}
                disabled={loading}
                className={`w-full px-6 py-3 rounded-lg text-white font-semibold hover:shadow-xl hover:scale-105 transition-all duration-200 shadow-lg ${
                  loading
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600"
                }`}
              >
                {loading ? "Sending..." : "Send Invite"}
              </button>
            </div>
          </div>
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {fetching ? (
            <div className="col-span-full">
              <div 
                className="rounded-2xl shadow-xl p-16 text-center transition-colors duration-300"
                style={{
                  background: isDark ? '#0f1629' : '#ffffff',
                  border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`
                }}
              >
                <p 
                  className="text-lg font-medium transition-colors duration-300"
                  style={{color: isDark ? '#9ca3af' : '#4b5563'}}
                >
                  Loading team members...
                </p>
              </div>
            </div>
          ) : teamMembers.length > 0 ? (
            teamMembers.map((member) => (
              <div
                key={member.id}
                className="rounded-2xl shadow-xl p-6 relative group hover:border-indigo-500/50 transition-all duration-300"
                style={{
                  background: isDark ? '#0f1629' : '#ffffff',
                  border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`
                }}
              >
                {/* Delete Button */}
                {!member.isYou && member.role !== "ADMIN" && (
                  <button
                    onClick={() => handleDeleteMember(member.id, member.role)}
                    className="absolute top-4 right-4 w-10 h-10 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 opacity-0 group-hover:opacity-100"
                    style={{
                      background: isDark ? '#1a2235' : '#f3f4f6',
                      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
                    }}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}

                {/* Avatar + Name */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        member.name?.charAt(0)?.toUpperCase()
                      )}
                    </div>
                    {member.isYou && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center shadow-lg">
                        <Crown className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="text-lg font-bold truncate transition-colors duration-300"
                      style={{color: isDark ? '#ffffff' : '#111827'}}
                    >
                      {member.name}
                      {member.isYou && (
                        <span 
                          className="text-sm ml-2 transition-colors duration-300"
                          style={{color: isDark ? '#9ca3af' : '#6b7280'}}
                        >
                          (You)
                        </span>
                      )}
                    </h3>
                    <div className={`inline-flex items-center gap-2 mt-2 px-3 py-1 text-xs font-bold rounded-lg bg-gradient-to-r ${getRoleColor(member.role)} text-white shadow-md`}>
                      {getRoleIcon(member.role)}
                      {member.role}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div 
                  className="mb-5 transition-colors duration-300"
                  style={{borderTop: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`}}
                ></div>

                {/* Contact Info */}
                <div className="space-y-3">
                  <div 
                    className="flex items-center gap-3 p-3 rounded-lg hover:border-gray-600 transition-colors duration-200"
                    style={{
                      background: isDark ? '#1a2235' : '#f9fafb',
                      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
                    }}
                  >
                    <div className="w-9 h-9 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-green-500/30">
                      <Mail className="w-4 h-4 text-green-400" />
                    </div>
                    <p 
                      className="text-sm truncate flex-1 transition-colors duration-300"
                      style={{color: isDark ? '#d1d5db' : '#374151'}}
                    >
                      {member.email}
                    </p>
                  </div>
                  <div 
                    className="flex items-center gap-3 p-3 rounded-lg hover:border-gray-600 transition-colors duration-200"
                    style={{
                      background: isDark ? '#1a2235' : '#f9fafb',
                      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
                    }}
                  >
                    <div className="w-9 h-9 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-green-500/30">
                      <Phone className="w-4 h-4 text-green-400" />
                    </div>
                    <p 
                      className="text-sm transition-colors duration-300"
                      style={{color: isDark ? '#d1d5db' : '#374151'}}
                    >
                      {member.phone || "No phone"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <div 
                className="rounded-2xl shadow-xl p-16 text-center transition-colors duration-300"
                style={{
                  background: isDark ? '#0f1629' : '#ffffff',
                  border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`
                }}
              >
                <div 
                  className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 transition-colors duration-300"
                  style={{
                    background: isDark ? '#1a2235' : '#f3f4f6',
                    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
                  }}
                >
                  <Users 
                    className="w-10 h-10 transition-colors duration-300"
                    style={{color: isDark ? '#4b5563' : '#9ca3af'}}
                  />
                </div>
                <p 
                  className="text-lg font-medium transition-colors duration-300"
                  style={{color: isDark ? '#9ca3af' : '#6b7280'}}
                >
                  No team members yet.
                </p>
                <p 
                  className="text-sm mt-2 transition-colors duration-300"
                  style={{color: isDark ? '#6b7280' : '#9ca3af'}}
                >
                  Invite your first team member to get started
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Team Stats */}
        {!fetching && teamMembers.length > 0 && (
          <div 
            className="rounded-2xl shadow-xl p-8 transition-colors duration-300"
            style={{
              background: isDark ? '#0f1629' : '#ffffff',
              border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`
            }}
          >
            <h3 
              className="text-xl font-bold mb-6 transition-colors duration-300"
              style={{color: isDark ? '#ffffff' : '#111827'}}
            >
              Team Overview
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <div 
                className="text-center p-6 rounded-xl hover:border-indigo-500/50 transition-colors duration-200"
                style={{
                  background: isDark ? '#1a2235' : '#f9fafb',
                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
                }}
              >
                <p className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  {teamMembers.length}
                </p>
                <p 
                  className="text-sm font-medium mt-3 transition-colors duration-300"
                  style={{color: isDark ? '#9ca3af' : '#6b7280'}}
                >
                  Total Members
                </p>
              </div>
              <div 
                className="text-center p-6 rounded-xl hover:border-purple-500/50 transition-colors duration-200"
                style={{
                  background: isDark ? '#1a2235' : '#f9fafb',
                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
                }}
              >
                <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {teamMembers.filter(m => m.role === "ADMIN").length}
                </p>
                <p 
                  className="text-sm font-medium mt-3 transition-colors duration-300"
                  style={{color: isDark ? '#9ca3af' : '#6b7280'}}
                >
                  Administrators
                </p>
              </div>
              <div 
                className="text-center p-6 rounded-xl hover:border-emerald-500/50 transition-colors duration-200"
                style={{
                  background: isDark ? '#1a2235' : '#f9fafb',
                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
                }}
              >
                <p className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                  100%
                </p>
                <p 
                  className="text-sm font-medium mt-3 transition-colors duration-300"
                  style={{color: isDark ? '#9ca3af' : '#6b7280'}}
                >
                  Active Status
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
