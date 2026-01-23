"use client"

import { useState, useEffect } from "react"
import { Inbox, Users, Layers, Plug, Settings, Image, Workflow, Code2, CreditCard, Crown, AlertCircle, Check } from "lucide-react"

export default function BillingPage() {
  const [billingCycle, setBillingCycle] = useState("monthly")
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
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

  const plans = [
    {
      name: "Free Plan",
      price: 0,
      unit: "per org / month",
      features: ["Basic Inbox", "1 Campaign", "Limited Integrations"],
      tag: "Critical • 1 day left",
      expiry: "Expires Oct 6, 2025",
      gradient: "from-gray-600 to-gray-700",
    },
    {
      name: "Domestic Plan",
      price: 3000,
      unit: "per org / month",
      features: ["Unlimited Inbox", "Unlimited Campaigns", "Full Integrations", "Priority Support"],
      tag: "Most Popular",
      gradient: "from-indigo-600 via-purple-600 to-pink-600",
    },
  ]

  const modules = [
    { name: "Inbox", icon: Inbox, color: "from-indigo-500 to-blue-500" },
    { name: "Contact", icon: Users, color: "from-green-500 to-emerald-500" },
    { name: "Campaign", icon: Layers, color: "from-pink-500 to-rose-500" },
    { name: "Integration", icon: Plug, color: "from-purple-500 to-indigo-500" },
    { name: "Manage", icon: Settings, color: "from-orange-500 to-red-500" },
    { name: "Gallery", icon: Image, color: "from-teal-500 to-cyan-500" },
    { name: "Automation", icon: Workflow, color: "from-yellow-500 to-amber-500" },
    { name: "Developer", icon: Code2, color: "from-gray-600 to-gray-800" },
  ]

  const moduleContent = {
    Inbox: {
      icon: Inbox,
      title: "Inbox",
      description: "Manage your Inbox and Contacts inside billing.",
      items: [
        { label: "Inbox", value: "✅ New" },
        { label: "Contact", value: "500" },
      ],
    },
    Contact: {
      icon: Users,
      title: "Contact",
      description: "Manage all your contacts and leads.",
      items: [
        { label: "Contacts", value: "✅ Unlimited" },
        { label: "Import/Export", value: "✅" },
      ],
    },
    Campaign: {
      icon: Layers,
      title: "Campaigns",
      description: "Create, manage, and track your campaigns.",
      items: [
        { label: "Campaign", value: "✅" },
        { label: "Broadcast", value: "✅" },
      ],
    },
    Integration: {
      icon: Plug,
      title: "Integration",
      description: "Connect with your favorite tools and platforms.",
      items: [
        { label: "Facebook Lead Ads", value: "✅" },
        { label: "Custom Lead API", value: "✅" },
        { label: "Custom Whatsapp API", value: "✅" },
        { label: "IndiaMart", value: "✅" },
        { label: "ExportersIndia", value: "✅" },
        { label: "Zoom", value: "✅" },
      ],
    },
    Manage: {
      icon: Settings,
      title: "Manage",
      description: "Control all aspects of your workspace.",
      items: [
        { label: "Whatsapp Template", value: "✅ 1k new" },
        { label: "Tags", value: "✅" },
        { label: "Columns", value: "✅" },
        { label: "Opts Management", value: "✅" },
        { label: "Webhook Events", value: "✅" },
        { label: "User", value: "✅ 100" },
      ],
    },
    Gallery: {
      icon: Image,
      title: "Gallery",
      description: "Manage your media assets.",
      items: [{ label: "Gallery", value: "✅" }],
    },
    Automation: {
      icon: Workflow,
      title: "Automation",
      description: "Build powerful automated workflows.",
      items: [
        { label: "Flows", value: "✅ 100 New" },
        { label: "Connections", value: "1k" },
        { label: "ChatBot", value: "✅ 20 BETA" },
      ],
    },
    Developer: {
      icon: Code2,
      title: "Developer",
      description: "Access API and developer resources.",
      items: [
        { label: "Whatsapp API", value: "✅" },
        { label: "Whatsapp API Docs", value: "✅" },
      ],
    },
  }

  return (
    <>
      <style jsx global>{`
        /* Animation styles */
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
      
      <div 
        className="billing-wrapper w-full min-h-screen p-8 overflow-auto transition-colors duration-300"
        style={{background: isDark ? '#0f1629' : '#f8fafc'}}
      >
        <div className="max-w-[90rem] mx-auto space-y-6">
          {/* Header Card */}
          <div 
            style={{background: isDark ? '#0f1629' : '#ffffff'}} 
            className="rounded-2xl shadow-xl overflow-hidden relative transition-colors duration-300"
            css={{border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`}}
          >
            {/* Gradient Banner */}
            <div 
              className="gradient-banner h-[240px] rounded-t-2xl relative shadow-[0_0_40px_-8px_rgba(99,102,241,0.6)]"
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
                  style={{
                    background: isDark ? '#1a2235' : '#f3f4f6',
                    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
                  }} 
                  className="w-28 h-28 rounded-2xl flex items-center justify-center shadow-xl ring-4 transition-colors duration-300"
                  css={{ringColor: isDark ? '#0f1629' : '#ffffff'}}
                >
                  <CreditCard className="w-14 h-14 text-indigo-400" />
                </div>

                {/* Text beside logo */}
                <div className="pb-1">
                  <h1 
                    className="text-3xl font-bold transition-colors duration-300"
                    style={{color: isDark ? '#ffffff' : '#111827'}}
                  >
                    Billing & Plans
                  </h1>
                  <p 
                    className="transition-colors duration-300"
                    style={{color: isDark ? '#9ca3af' : '#4b5563'}}
                  >
                    Manage your subscription and pricing
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <div 
            style={{
              background: isDark ? '#0f1629' : '#ffffff',
              border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`
            }} 
            className="rounded-2xl shadow-xl p-8 transition-colors duration-300"
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
                    Choose Your Plan
                  </p>
                  <p 
                    className="text-sm mt-0.5 transition-colors duration-300"
                    style={{color: isDark ? 'rgba(147, 197, 253, 0.8)' : '#2563eb'}}
                  >
                    Select the perfect plan for your organization. Upgrade or downgrade anytime with flexible billing options.
                  </p>
                </div>
              </div>
            </div>

            {/* Billing Cycle Toggle */}
            <div className="flex justify-center mb-8">
              <div 
                className="relative p-1 rounded-xl transition-colors duration-300" 
                style={{
                  background: isDark ? '#1a2235' : '#f3f4f6',
                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
                }}
              >
                <div className="flex gap-1">
                  <button
                    onClick={() => setBillingCycle("monthly")}
                    className="relative px-8 py-3 rounded-lg font-semibold text-sm transition-all duration-300 shadow-lg"
                    style={billingCycle === "monthly" 
                      ? {background: 'linear-gradient(to right, rgb(79, 70, 229), rgb(109, 40, 217))', color: 'white'} 
                      : {background: 'transparent', color: isDark ? '#9ca3af' : '#4b5563'}
                    }
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle("yearly")}
                    className="relative px-8 py-3 rounded-lg font-semibold text-sm transition-all duration-300"
                    style={billingCycle === "yearly" 
                      ? {background: 'linear-gradient(to right, rgb(79, 70, 229), rgb(109, 40, 217))', color: 'white'} 
                      : {background: 'transparent', color: isDark ? '#9ca3af' : '#4b5563'}
                    }
                  >
                    <div className="flex items-center gap-2">
                      Yearly
                      <span 
                        className="px-2 py-0.5 text-xs rounded-full font-bold transition-colors duration-300" 
                        style={{
                          background: 'rgba(34, 197, 94, 0.2)', 
                          color: isDark ? '#4ade80' : 'rgb(22, 163, 74)', 
                          border: '1px solid rgba(34, 197, 94, 0.3)'
                        }}
                      >
                        Save 20%
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {plans.map((plan, index) => (
                <div
                  key={index}
                  style={{
                    background: isDark ? '#1a2235' : '#f9fafb',
                    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
                  }}
                  className="group relative rounded-xl shadow-md p-6 hover:border-indigo-300 transition-all duration-300"
                >
                  <div className="space-y-5">
                    {/* Plan Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 
                          className="text-xl font-bold mb-1 transition-colors duration-300"
                          style={{color: isDark ? '#ffffff' : '#111827'}}
                        >
                          {plan.name}
                        </h2>
                        {plan.expiry && (
                          <div className="flex items-center gap-2 text-xs mt-2">
                            <span className="flex h-2 w-2">
                              <span className="animate-ping absolute h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            <span 
                              className="font-semibold transition-colors duration-300"
                              style={{color: isDark ? '#f87171' : '#dc2626'}}
                            >
                              {plan.expiry}
                            </span>
                          </div>
                        )}
                      </div>
                      {plan.tag && (
                        <div 
                          className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors duration-300"
                          style={index === 0 
                            ? {
                                background: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgb(254, 226, 226)', 
                                color: isDark ? '#f87171' : 'rgb(185, 28, 28)', 
                                border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgb(254, 202, 202)'}`
                              } 
                            : {
                                background: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgb(224, 231, 255)', 
                                color: isDark ? '#a5b4fc' : 'rgb(67, 56, 202)', 
                                border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgb(199, 210, 254)'}`
                              }
                          }
                        >
                          {plan.tag}
                        </div>
                      )}
                    </div>

                    {/* Price */}
                    <div className="py-3">
                      <div className="flex items-baseline gap-2">
                        <span 
                          className="text-4xl font-extrabold"
                          style={{
                            background: index === 0 
                              ? 'linear-gradient(to right, rgb(75, 85, 99), rgb(55, 65, 81))' 
                              : 'linear-gradient(to right, rgb(79, 70, 229), rgb(109, 40, 217), rgb(219, 39, 119))',
                            WebkitBackgroundClip: 'text',
                            backgroundClip: 'text',
                            color: 'transparent'
                          }}
                        >
                          {plan.price === 0 ? "Free" : `₹${plan.price.toLocaleString()}`}
                        </span>
                      </div>
                      <p 
                        className="text-sm mt-1 transition-colors duration-300"
                        style={{color: isDark ? '#9ca3af' : '#4b5563'}}
                      >
                        {plan.unit}
                      </p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm">
                          <div 
                            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-300" 
                            style={{
                              background: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgb(220, 252, 231)', 
                              border: `1px solid ${isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgb(187, 247, 208)'}`
                            }}
                          >
                            <Check 
                              className="w-3 h-3 transition-colors duration-300" 
                              style={{color: isDark ? '#4ade80' : '#16a34a'}}
                            />
                          </div>
                          <span 
                            className="font-medium transition-colors duration-300"
                            style={{color: isDark ? '#d1d5db' : '#374151'}}
                          >
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <button
                      className="w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200"
                      style={plan.price === 0
                        ? {
                            background: isDark ? '#0f1629' : '#f3f4f6', 
                            color: isDark ? '#d1d5db' : '#374151', 
                            border: `1px solid ${isDark ? '#374151' : '#d1d5db'}`
                          }
                        : {
                            background: 'linear-gradient(to right, rgb(79, 70, 229), rgb(109, 40, 217))', 
                            color: 'white', 
                            boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)'
                          }
                      }
                    >
                      {plan.price === 0 ? "Current Plan" : (
                        <span className="flex items-center justify-center gap-2">
                          <Crown className="w-4 h-4" />
                          Upgrade Now
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modules Section */}
          <div 
            style={{
              background: isDark ? '#0f1629' : '#ffffff',
              border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`
            }} 
            className="rounded-2xl shadow-xl p-8 transition-colors duration-300"
          >
            <div className="space-y-6">
              <div className="text-center">
                <h2 
                  className="text-2xl font-bold mb-2 transition-colors duration-300"
                  style={{color: isDark ? '#ffffff' : '#111827'}}
                >
                  Explore Features
                </h2>
                <p 
                  className="text-sm transition-colors duration-300"
                  style={{color: isDark ? '#9ca3af' : '#4b5563'}}
                >
                  Click on any module to see what's included
                </p>
              </div>

              {/* Module Grid */}
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                {modules.map((mod, i) => {
                  const Icon = mod.icon
                  const isSelected = selectedModule === mod.name
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedModule(mod.name)}
                      style={{
                        background: isDark ? '#1a2235' : '#f9fafb',
                        border: isSelected 
                          ? '1px solid rgb(99, 102, 241)' 
                          : `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
                      }}
                      className={`group relative rounded-xl p-4 transition-all duration-300 ${
                        isSelected
                          ? "shadow-lg scale-105 ring-2 ring-indigo-500"
                          : "hover:shadow-md"
                      }`}
                    >
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md transition-transform duration-300 group-hover:scale-110"
                          style={{
                            background: mod.color.includes('indigo') ? 'linear-gradient(to right, rgb(99, 102, 241), rgb(59, 130, 246))' :
                                       mod.color.includes('green') ? 'linear-gradient(to right, rgb(34, 197, 94), rgb(16, 185, 129))' :
                                       mod.color.includes('pink') ? 'linear-gradient(to right, rgb(236, 72, 153), rgb(244, 63, 94))' :
                                       mod.color.includes('purple') ? 'linear-gradient(to right, rgb(168, 85, 247), rgb(99, 102, 241))' :
                                       mod.color.includes('orange') ? 'linear-gradient(to right, rgb(249, 115, 22), rgb(239, 68, 68))' :
                                       mod.color.includes('teal') ? 'linear-gradient(to right, rgb(20, 184, 166), rgb(6, 182, 212))' :
                                       mod.color.includes('yellow') ? 'linear-gradient(to right, rgb(234, 179, 8), rgb(245, 158, 11))' :
                                       'linear-gradient(to right, rgb(75, 85, 99), rgb(31, 41, 55))'
                          }}
                        >
                          <Icon size={20} />
                        </div>
                        <h3 
                          className="font-semibold text-xs transition-colors duration-300"
                          style={{color: isDark ? '#ffffff' : '#111827'}}
                        >
                          {mod.name}
                        </h3>
                      </div>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Module Content */}
              {selectedModule && moduleContent[selectedModule] && (
                <div 
                  style={{
                    background: isDark ? 'rgba(26, 34, 53, 0.5)' : 'rgba(249, 250, 251, 0.5)',
                    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
                  }} 
                  className="rounded-xl p-6 animate-fade-in transition-colors duration-300"
                >
                  <div className="flex items-center gap-3 mb-5">
                    {(() => {
                      const Icon = moduleContent[selectedModule].icon
                      const mod = modules.find(m => m.name === selectedModule)
                      return (
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-md"
                          style={{
                            background: mod?.color.includes('indigo') ? 'linear-gradient(to right, rgb(99, 102, 241), rgb(59, 130, 246))' :
                                       mod?.color.includes('green') ? 'linear-gradient(to right, rgb(34, 197, 94), rgb(16, 185, 129))' :
                                       mod?.color.includes('pink') ? 'linear-gradient(to right, rgb(236, 72, 153), rgb(244, 63, 94))' :
                                       mod?.color.includes('purple') ? 'linear-gradient(to right, rgb(168, 85, 247), rgb(99, 102, 241))' :
                                       mod?.color.includes('orange') ? 'linear-gradient(to right, rgb(249, 115, 22), rgb(239, 68, 68))' :
                                       mod?.color.includes('teal') ? 'linear-gradient(to right, rgb(20, 184, 166), rgb(6, 182, 212))' :
                                       mod?.color.includes('yellow') ? 'linear-gradient(to right, rgb(234, 179, 8), rgb(245, 158, 11))' :
                                       'linear-gradient(to right, rgb(75, 85, 99), rgb(31, 41, 55))'
                          }}
                        >
                          <Icon size={20} />
                        </div>
                      )
                    })()}
                    <div>
                      <h2 
                        className="text-xl font-bold transition-colors duration-300"
                        style={{color: isDark ? '#ffffff' : '#111827'}}
                      >
                        {moduleContent[selectedModule].title}
                      </h2>
                      <p 
                        className="text-xs transition-colors duration-300"
                        style={{color: isDark ? '#9ca3af' : '#4b5563'}}
                      >
                        {moduleContent[selectedModule].description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {moduleContent[selectedModule].items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: isDark ? '#1a2235' : '#ffffff',
                          border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
                        }}
                        className="flex items-center justify-between p-3 rounded-lg hover:border-gray-300 transition-all duration-200"
                      >
                        <span 
                          className="font-medium text-sm transition-colors duration-300"
                          style={{color: isDark ? '#d1d5db' : '#374151'}}
                        >
                          {item.label}
                        </span>
                        <span 
                          className="font-semibold text-sm transition-colors duration-300"
                          style={{color: isDark ? '#a5b4fc' : '#4f46e5'}}
                        >
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}