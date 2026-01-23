"use client";

import { useState, useEffect } from "react";
import {
  Edit2,
  Save,
  Mail,
  Phone,
  School,
  Award,
  Shield,
  Camera,
  Check,
  X,
  Briefcase,
  TrendingUp,
  Star,
  Zap,
  Target,
  Users,
} from "lucide-react";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    image: "",
    status: "",
    school: "",
    grade: "",
    role: "",
  });
  const [tempProfile, setTempProfile] = useState(profile);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(()=>{
    const fetchUserData = async () => {
      try{
        console.log("fetching user data");
        const data = await fetch('/api/user', {
          credentials: 'include'
        });
        console.log(data.status, data.statusText);
        console.log(Object.fromEntries(data.headers.entries()));
        
        
        if(!data.ok) throw new Error('Failed to fetch user data');
        const userData = await data.json();
        console.log(userData);
        setProfile((prev)=> ({...prev, ...userData}) );
        setTempProfile((prev)=> ({...prev, ...userData}) );
      }catch(err){
        console.error('Error fetching user data:', err);
      } finally{
        setLoading(false)
      }
    }
    fetchUserData();
  }, []);

  // Sync tempProfile when profile changes
  // useEffect(() => {
  //   setTempProfile((prev)=>({...prev, ...profile}));
  // }, [profile]);

  // Watch theme changes
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const handleChange = (field, value) => {
    setTempProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setProfile(tempProfile);
      setIsEditing(false);
      setShowSuccess(true);
      setLoading(false);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 700);
  };

  const handleCancel = () => {
    setTempProfile(profile);
    setIsEditing(false);
  };

  const getRoleColor = (role) => {
    const normalizedRole = (role || "").toUpperCase();
    switch (normalizedRole) {
      case "ADMIN":
        return "from-violet-500 via-purple-500 to-fuchsia-500";
      case "MEMBER":
        return "from-cyan-500 via-blue-500 to-indigo-500";
      case "VIEWER":
        return "from-gray-500 via-slate-500 to-zinc-500";
      default:
        return "from-pink-500 via-rose-500 to-red-500";
    }
  };

  // Loading UI
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-lg text-gray-400">
        Loading your profile...
      </div>
    );
  }

  // No user data
  if (!profile || !tempProfile) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-red-500 font-semibold">
        No user data found. Please log in again.
      </div>
    );
  }

  return (
    <div className="profile-page-wrapper">
      <style jsx global>{`
        /* Animations */
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(100px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        /* 🔥 CRITICAL FIXES - DO NOT REMOVE */
        /* These fix the white background and missing gradient issues */
        
        /* Restore gradient backgrounds */
        .profile-page-wrapper .bg-gradient-to-r,
        .profile-page-wrapper .bg-gradient-to-br,
        .profile-page-wrapper .bg-gradient-to-l,
        .profile-page-wrapper .bg-gradient-to-t,
        .profile-page-wrapper .bg-gradient-to-b,
        .profile-page-wrapper .bg-gradient-to-tr,
        .profile-page-wrapper .bg-gradient-to-tl,
        .profile-page-wrapper .bg-gradient-to-bl {
          background-image: linear-gradient(var(--tw-gradient-stops)) !important;
          background-color: transparent !important;
        }

        /* Restore white text on gradients */
        .profile-page-wrapper .text-white {
          color: #ffffff !important;
        }

        /* Ensure gradient colors work */
        .profile-page-wrapper .from-violet-500 { --tw-gradient-from: #8b5cf6 !important; }
        .profile-page-wrapper .via-purple-500 { --tw-gradient-via: #a855f7 !important; }
        .profile-page-wrapper .to-fuchsia-500 { --tw-gradient-to: #d946ef !important; }
        .profile-page-wrapper .from-emerald-500 { --tw-gradient-from: #10b981 !important; }
        .profile-page-wrapper .to-green-500 { --tw-gradient-to: #22c55e !important; }
        .profile-page-wrapper .from-violet-600 { --tw-gradient-from: #7c3aed !important; }
        .profile-page-wrapper .via-fuchsia-600 { --tw-gradient-via: #c026d3 !important; }
        .profile-page-wrapper .to-pink-600 { --tw-gradient-to: #db2777 !important; }
        .profile-page-wrapper .from-amber-500 { --tw-gradient-from: #f59e0b !important; }
        .profile-page-wrapper .to-orange-500 { --tw-gradient-to: #f97316 !important; }
        .profile-page-wrapper .from-cyan-500 { --tw-gradient-from: #06b6d4 !important; }
        .profile-page-wrapper .via-blue-500 { --tw-gradient-via: #3b82f6 !important; }
        .profile-page-wrapper .to-indigo-500 { --tw-gradient-to: #6366f1 !important; }
        .profile-page-wrapper .from-violet-400 { --tw-gradient-from: #a78bfa !important; }
        .profile-page-wrapper .to-fuchsia-400 { --tw-gradient-to: #e879f9 !important; }
        .profile-page-wrapper .from-cyan-400 { --tw-gradient-from: #22d3ee !important; }
        .profile-page-wrapper .to-blue-400 { --tw-gradient-to: #60a5fa !important; }
        .profile-page-wrapper .from-pink-400 { --tw-gradient-from: #f472b6 !important; }
        .profile-page-wrapper .to-rose-400 { --tw-gradient-to: #fb7185 !important; }
        .profile-page-wrapper .from-violet-500\/20 { --tw-gradient-from: rgba(139, 92, 246, 0.2) !important; }
        .profile-page-wrapper .to-fuchsia-500\/20 { --tw-gradient-to: rgba(217, 70, 239, 0.2) !important; }
        .profile-page-wrapper .via-fuchsia-500\/10 { --tw-gradient-via: rgba(217, 70, 239, 0.1) !important; }
        .profile-page-wrapper .to-pink-500\/10 { --tw-gradient-to: rgba(236, 72, 153, 0.1) !important; }
      `}</style>

      <div
        className="min-h-screen py-8 px-8 relative overflow-hidden transition-colors duration-300"
        style={{ background: isDark ? "transparent" : "#f8fafc" }}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        {/* Success Notification */}
        {showSuccess && (
          <div className="fixed top-8 right-8 z-50 animate-slide-in">
            <div
              className="rounded-2xl shadow-2xl p-5 flex items-center gap-4 border border-emerald-500/30 backdrop-blur-xl min-w-[320px] transition-colors duration-300"
              style={{ background: isDark ? "rgba(15, 23, 42, 0.8)" : "#ffffff" }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/50">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <p
                  className="font-bold text-lg transition-colors duration-300"
                  style={{ color: isDark ? "#ffffff" : "#111827" }}
                >
                  Success!
                </p>
                <p className="text-sm text-gray-400">Profile updated successfully</p>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-[1800px] mx-auto space-y-6 relative z-10">
          {/* Hero Profile Card */}
          <div
            className="backdrop-blur-xl rounded-3xl shadow-2xl overflow-visible transition-colors duration-300"
            style={{
              background: isDark ? "rgba(15, 23, 42, 0.6)" : "#ffffff",
              border: `1px solid ${isDark ? "#1f2937" : "#e5e7eb"}`,
            }}
          >
            {/* Header Banner */}
            <div className="h-48 rounded-xl bg-gradient-to-r from-[#0A0F24] via-[#1E2761] to-[#533483] border border-white/5 shadow-inner relative overflow-hidden">
              <div
                className={`absolute inset-0 bg-[url(${profile.image})] opacity-20 animate-pulse`}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent"></div>
            </div>

            {/* Letter Profile Picture */}
            <div className="px-10 pb-8 relative">
              <div className="flex items-end justify-between -mt-8 gap-6">
                <div className="flex items-end gap-6 overflow-visible">
                  <div className="relative group flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div
                      className="relative w-36 h-36 rounded-3xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center text-white text-6xl font-bold shadow-2xl ring-4 group-hover:scale-105 transition-transform duration-300"
                      style={{ ringColor: isDark ? "#0f1629" : "#ffffff" }}
                    >
                      {profile.image ? ( 
                      <img 
                      src={profile.image} 
                      // width={100} 
                      // height={100} 
                      alt="" 
                      className="rounded-2xl object-cover w-34 h-34"
                      />
                      )
                      : 
                      
                        profile.name.charAt(0).toUpperCase()
                      
                    }
                    </div>
                    <button
                      className="absolute bottom-3 right-3 w-11 h-11 rounded-xl shadow-xl flex items-center justify-center hover:scale-110 transition-all duration-200 border border-violet-500/50"
                      style={{ background: isDark ? "#1a2235" : "#ffffff" }}
                    >
                      <Camera className="w-5 h-5 text-violet-400" />
                    </button>
                  </div>

                  <div className="pb-3 space-y-3">
                    <div className="flex items-center gap-4">
                      <h1
                        className="text-4xl font-bold leading-tight tracking-tight transition-colors duration-300 whitespace-nowrap"
                        style={{ color: isDark ? "#ffffff" : "#111827" }}
                      >
                        {profile.name}
                      </h1>
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/50 flex-shrink-0">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <span
                        className={`px-5 py-2 rounded-xl text-white bg-gradient-to-r ${getRoleColor(
                          profile.role
                        )} text-sm font-bold shadow-lg shadow-violet-500/50 flex items-center gap-2 hover:scale-105 transition-transform duration-200 flex-shrink-0`}
                      >
                        <Shield className="w-4 h-4" />
                        {String(profile.role).toUpperCase()}
                      </span>
                      <div className="flex items-center gap-2 text-gray-400 hover:text-violet-400 transition-colors duration-200">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium text-sm">{profile.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 hover:text-violet-400 transition-colors duration-200">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium text-sm">{profile.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pb-3 flex-shrink-0">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/50 hover:shadow-xl hover:shadow-violet-500/70 hover:scale-105 transition-all duration-200 whitespace-nowrap"
                    >
                      <Edit2 size={20} />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-6 py-4 font-bold rounded-xl transition-all duration-200 whitespace-nowrap"
                        style={{
                          background: isDark ? "#1a2235" : "#f3f4f6",
                          color: isDark ? "#ffffff" : "#111827",
                          border: `1px solid ${isDark ? "#374151" : "#d1d5db"}`,
                        }}
                      >
                        <X size={20} />
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/70 hover:scale-105 transition-all duration-200 whitespace-nowrap"
                      >
                        <Save size={20} />
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Sidebar */}
            <div className="col-span-3 space-y-6">
              {/* Status Card */}
              <div className="bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden group hover:scale-105 transition-transform duration-300">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5" />
                    <h3 className="text-lg font-bold">Account Status</h3>
                  </div>
                  <p className="text-white/80 text-sm mb-5">Active and verified</p>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                    <span className="font-bold">Active Now</span>
                  </div>
                </div>
              </div>

              <div
  className="backdrop-blur-xl rounded-2xl shadow-xl p-6 transition-colors duration-300"
  style={{
    background: isDark ? "rgba(15, 23, 42, 0.6)" : "#ffffff",
    border: `1px solid ${isDark ? "#1f2937" : "#e5e7eb"}`,
  }}
>
  <h3
    className="text-lg font-bold mb-5 flex items-center gap-2 transition-colors duration-300"
    style={{ color: isDark ? "#ffffff" : "#111827" }}
  >
    <TrendingUp className="w-5 h-5 text-violet-400" />
    Activity Overview
  </h3>

  <div className="space-y-3">

    {/* Profile Views */}
    <div className="group rounded-xl transition-all duration-200 cursor-pointer hover:shadow-md">
      <div className="rounded-xl px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 dark:brightness-90 text-white flex justify-between items-center transition-transform group-hover:scale-[1.01]">
        <span className="text-sm opacity-90">Profile Views</span>
        <span className="text-2xl font-bold drop-shadow">243</span>
      </div>
    </div>

    {/* Connections */}
    <div className="group rounded-xl transition-all duration-200 cursor-pointer hover:shadow-md">
      <div className="rounded-xl px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 dark:brightness-90 text-white flex justify-between items-center transition-transform group-hover:scale-[1.01]">
        <span className="text-sm opacity-90">Connections</span>
        <span className="text-2xl font-bold drop-shadow">89</span>
      </div>
    </div>

    {/* Projects */}
    <div className="group rounded-xl transition-all duration-200 cursor-pointer hover:shadow-md">
      <div className="rounded-xl px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 dark:brightness-90 text-white flex justify-between items-center transition-transform group-hover:scale-[1.01]">
        <span className="text-sm opacity-90">Projects</span>
        <span className="text-2xl font-bold drop-shadow">12</span>
      </div>
    </div>

  </div>
</div>

            </div>

            {/* Main Content */}
            <div className="col-span-9">
              {/* Personal Info */}
              <div
                className="backdrop-blur-xl rounded-2xl shadow-xl p-8 transition-colors duration-300"
                style={{
                  background: isDark ? "rgba(15, 23, 42, 0.6)" : "#ffffff",
                  border: `1px solid ${isDark ? "#1f2937" : "#e5e7eb"}`,
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2
                      className="text-3xl font-bold mb-1 transition-colors duration-300"
                      style={{ color: isDark ? "#ffffff" : "#111827" }}
                    >
                      Personal Information
                    </h2>
                    <p className="text-gray-400">Manage your profile details and preferences</p>
                  </div>
                  {isEditing && (
                    <div className="px-4 py-2 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-xl border border-violet-500/50 backdrop-blur-sm">
                      <p className="text-sm text-violet-400 font-bold flex items-center gap-2">
                        <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse"></div>
                        EDITING MODE
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-8">
                  {["name", "email", "phone", "school", "grade"].map((field) => (
                    <div key={field} className="space-y-2 group">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span>
                          {field === "name"
                            ? "Full Name"
                            : field === "email"
                            ? "Email Address"
                            : field === "phone"
                            ? "Phone Number"
                            : field.charAt(0).toUpperCase() + field.slice(1)}
                        </span>
                        {isEditing && ["name", "email", "phone"].includes(field) && (
                          <span className="text-pink-500">*</span>
                        )}
                      </label>
                      {isEditing ? (
                        <input
                          type={field === "email" ? "email" : "text"}
                          value={tempProfile[field] || ""}
                          onChange={(e) => handleChange(field, e.target.value)}
                          className="w-full px-5 py-4 rounded-xl border-2 border-violet-500/50 focus:border-violet-500 shadow-lg shadow-violet-500/20 outline-none transition-all duration-200 font-medium"
                          style={{
                            background: isDark ? "#0f1629" : "#ffffff",
                            color: isDark ? "#ffffff" : "#111827",
                          }}
                          placeholder={`Enter ${field}`}
                        />
                      ) : (
                        <p
                          className="text-lg font-semibold py-2"
                          style={{ color: isDark ? "#ffffff" : "#111827" }}
                        >
                          {profile[field] || "-"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {isEditing && (
                  <div className="mt-8 p-5 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 rounded-xl border border-violet-500/30 backdrop-blur-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/50">
                        <span className="text-white font-bold">!</span>
                      </div>
                      <div>
                        <p className="font-bold mb-1" style={{ color: isDark ? "#ffffff" : "#111827" }}>
                          Important Information
                        </p>
                        <p className="text-sm text-gray-400">
                          Please verify all information before saving. Changes will take effect immediately and be visible
                          across your entire profile.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Achievement Badge */}
              <div
                className="backdrop-blur-xl rounded-2xl shadow-xl p-6 hover:border-amber-500/50 transition-all duration-300 group"
                style={{
                  background: isDark ? "rgba(15, 23, 42, 0.6)" : "#ffffff",
                  border: `1px solid ${isDark ? "#1f2937" : "#e5e7eb"}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/50 group-hover:scale-110 transition-transform duration-300">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl mb-1" style={{ color: isDark ? "#ffffff" : "#111827" }}>
                        Top Performer
                      </h3>
                      <p className="text-gray-400 text-sm">Elite Member</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm mb-2">Progress to next level</p>
                    <div className="w-64 rounded-full h-3 overflow-hidden" style={{ background: isDark ? "#1f2937" : "#e5e7eb" }}>
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-1000" style={{ width: "89%" }}></div>
                    </div>
                    <p className="text-amber-400 text-sm font-bold mt-2">89% Complete</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}