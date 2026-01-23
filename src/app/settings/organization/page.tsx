"use client"

import { useState, useEffect } from "react"
import { Building2, Globe, Briefcase, Save, Check, AlertCircle } from "lucide-react"

export default function OrganisationPage() {
  const [orgName, setOrgName] = useState("")
  const [industry, setIndustry] = useState("")
  const [website, setWebsite] = useState("")
  const [description, setDescription] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }
    
    checkTheme()
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [])

  const handleSave = () => {
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  return (
    <>
      <style jsx global>{`
        /* Animation styles */
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.4s ease-out;
        }
      `}</style>

      <div 
        className="w-full min-h-screen p-8 overflow-auto transition-colors duration-300"
        style={{background: isDark ? '#0f1629' : '#f8fafc'}}
      >
        {/* Success Toast */}
        {showSuccess && (
          <div className="fixed top-6 right-6 z-50 animate-slide-in">
            <div 
              className="rounded-xl shadow-2xl p-4 flex items-center gap-3 border-l-4 border-green-500 min-w-[300px] transition-colors duration-300"
              style={{background: isDark ? '#0f1629' : '#ffffff'}}
            >
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Check 
                  className="w-5 h-5 transition-colors duration-300"
                  style={{color: isDark ? '#4ade80' : '#16a34a'}}
                />
              </div>
              <div>
                <p 
                  className="font-bold transition-colors duration-300"
                  style={{color: isDark ? '#ffffff' : '#111827'}}
                >
                  Success!
                </p>
                <p 
                  className="text-sm transition-colors duration-300"
                  style={{color: isDark ? '#9ca3af' : '#4b5563'}}
                >
                  Organisation details saved
                </p>
              </div>
            </div>
          </div>
        )}

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
                  <svg
                    className="w-14 h-14 text-indigo-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
                    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" />
                    <line x1="6" y1="14" x2="10" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Text beside logo */}
                <div className="pb-1">
                  <h1 
                    className="text-3xl font-bold transition-colors duration-300"
                    style={{color: isDark ? '#ffffff' : '#111827'}}
                  >
                    Organisation
                  </h1>
                  <p 
                    className="transition-colors duration-300"
                    style={{color: isDark ? '#9ca3af' : '#4b5563'}}
                  >
                    Edit organisation details
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
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
                    Organisation Information
                  </p>
                  <p 
                    className="text-sm mt-0.5 transition-colors duration-300"
                    style={{color: isDark ? 'rgba(147, 197, 253, 0.8)' : '#2563eb'}}
                  >
                    Keep your organisation details up to date. This information will be visible across your platform.
                  </p>
                </div>
              </div>
            </div>

            {/* Form Grid */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Organisation Name */}
                <div className="space-y-2">
                  <label 
                    className="text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-colors duration-300"
                    style={{color: isDark ? '#9ca3af' : '#4b5563'}}
                  >
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    Organization Name
                    <span 
                      className="transition-colors duration-300"
                      style={{color: isDark ? '#f87171' : '#dc2626'}}
                    >
                      *
                    </span>
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Enter your organisation name"
                    className="w-full px-4 py-3 rounded-lg outline-none transition-all duration-200"
                    style={{
                      background: isDark ? '#1a2235' : '#f9fafb',
                      border: `1px solid ${isDark ? '#374151' : '#d1d5db'}`,
                      color: isDark ? '#ffffff' : '#111827'
                    }}
                  />
                </div>

                {/* Industry */}
                <div className="space-y-2">
                  <label 
                    className="text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-colors duration-300"
                    style={{color: isDark ? '#9ca3af' : '#4b5563'}}
                  >
                    <Briefcase className="w-4 h-4 text-purple-400" />
                    Industry
                    <span 
                      className="transition-colors duration-300"
                      style={{color: isDark ? '#f87171' : '#dc2626'}}
                    >
                      *
                    </span>
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg outline-none transition-all duration-200"
                    style={{
                      background: isDark ? '#1a2235' : '#f9fafb',
                      border: `1px solid ${isDark ? '#374151' : '#d1d5db'}`,
                      color: isDark ? '#ffffff' : '#111827'
                    }}
                  >
                    <option value="">Select industry type</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Construction">Construction</option>
                    <option value="Retail Trade">Retail Trade</option>
                    <option value="Wholesale Trade">Wholesale Trade</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Finance & Insurance">Finance & Insurance</option>
                    <option value="Information Technology & Services">Information Technology & Services</option>
                    <option value="Transportation & Logistics">Transportation & Logistics</option>
                    <option value="Professional & Business Services">Professional & Business Services</option>
                    <option value="Hospitality & Tourism">Hospitality & Tourism</option>
                    <option value="Government & Public Administration">Government & Public Administration</option>
                  </select>
                </div>
              </div>

              {/* Website - Full Width */}
              <div className="space-y-2">
                <label 
                  className="text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-colors duration-300"
                  style={{color: isDark ? '#9ca3af' : '#4b5563'}}
                >
                  <Globe className="w-4 h-4 text-pink-400" />
                  Website
                  <span 
                    className="text-xs normal-case font-normal transition-colors duration-300"
                    style={{color: isDark ? '#6b7280' : '#6b7280'}}
                  >
                    (Optional)
                  </span>
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://www.example.com"
                  className="w-full px-4 py-3 rounded-lg outline-none transition-all duration-200"
                  style={{
                    background: isDark ? '#1a2235' : '#f9fafb',
                    border: `1px solid ${isDark ? '#374151' : '#d1d5db'}`,
                    color: isDark ? '#ffffff' : '#111827'
                  }}
                />
              </div>

              {/* Organisation Description */}
              <div className="space-y-2">
                <label 
                  className="text-xs font-bold uppercase tracking-wide transition-colors duration-300"
                  style={{color: isDark ? '#9ca3af' : '#4b5563'}}
                >
                  Organisation Description
                  <span 
                    className="text-xs normal-case font-normal ml-2 transition-colors duration-300"
                    style={{color: isDark ? '#6b7280' : '#6b7280'}}
                  >
                    (Optional)
                  </span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us about your organisation..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg outline-none resize-none transition-all duration-200"
                  style={{
                    background: isDark ? '#1a2235' : '#f9fafb',
                    border: `1px solid ${isDark ? '#374151' : '#d1d5db'}`,
                    color: isDark ? '#ffffff' : '#111827'
                  }}
                />
              </div>

              {/* Organisation Stats */}
              <div 
                className="grid grid-cols-3 gap-6 p-6 rounded-xl transition-colors duration-300"
                style={{
                  background: isDark ? 'rgba(26, 34, 53, 0.5)' : '#f9fafb',
                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
                }}
              >
                <div className="text-center">
                  <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">156</p>
                  <p 
                    className="text-sm font-medium mt-2 transition-colors duration-300"
                    style={{color: isDark ? '#9ca3af' : '#4b5563'}}
                  >
                    Team Members
                  </p>
                </div>
                <div 
                  className="text-center transition-colors duration-300"
                  style={{
                    borderLeft: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                    borderRight: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
                  }}
                >
                  <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">24</p>
                  <p 
                    className="text-sm font-medium mt-2 transition-colors duration-300"
                    style={{color: isDark ? '#9ca3af' : '#4b5563'}}
                  >
                    Active Projects
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-pink-600 dark:text-pink-400">89%</p>
                  <p 
                    className="text-sm font-medium mt-2 transition-colors duration-300"
                    style={{color: isDark ? '#9ca3af' : '#4b5563'}}
                  >
                    Completion Rate
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div 
              className="flex items-center justify-end gap-4 mt-8 pt-6 transition-colors duration-300"
              style={{borderTop: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`}}
            >
              <button 
                className="px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                style={{
                  background: isDark ? '#1a2235' : '#f3f4f6',
                  color: isDark ? '#d1d5db' : '#374151',
                  border: `1px solid ${isDark ? '#374151' : '#d1d5db'}`
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-8 py-3 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                style={{background: 'linear-gradient(to right, rgb(79, 70, 229), rgb(109, 40, 217))'}}
              >
                <Save className="w-5 h-5" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}