"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Code,
  BookOpen,
  Zap,
  ExternalLink,
  FileText,
  Webhook,
  Terminal,
  Key,
} from "lucide-react";

export default function DevelopersPage() {
  const router = useRouter();

  const resources = [
    {
      title: "WhatsApp Business API",
      description: "Official WhatsApp Business API documentation and guides",
      icon: Code,
      color: "bg-green-600 hover:bg-green-700",
      onClick: () => router.push("/developers/api_generation"),
    },
    {
      title: "Getting Started Guide",
      description: "Step-by-step tutorial to integrate WhatsApp",
      href: "",
      icon: BookOpen,
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      title: "API Reference",
      description: "Complete API endpoints and parameters documentation",
      href: "",
      icon: FileText,
      color: "bg-purple-600 hover:bg-purple-700",
    },
    {
      title: "Webhooks",
      description: "Set up webhooks to receive real-time notifications",
      href: "",
      icon: Webhook,
      color: "bg-orange-600 hover:bg-orange-700",
    },
  ];

  const quickLinks = [
    {
      title: "Authentication",
      href: "https://developers.facebook.com/docs/whatsapp/business-management-api/get-started",
      icon: Key,
    },
    {
      title: "Message Templates",
      href: "https://developers.facebook.com/docs/whatsapp/message-templates",
      icon: FileText,
    },
    {
      title: "API Console",
      href: "https://developers.facebook.com/apps",
      icon: Terminal,
    },
  ];

  return (
    <div className="min-h-screen p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 
  bg-white dark:bg-gradient-to-br dark:from-blue-500 dark:to-purple-600
  border border-gray-200 dark:border-transparent
  rounded-2xl mb-4 shadow-lg">

            <Code className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
            Developer Resources
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to integrate and build with WhatsApp Business API
          </p>
        </div>

        {/* Main Resources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {resources.map((resource, idx) => {
            const Icon = resource.icon;

            return (
              <button
                key={idx}
                onClick={resource.onClick}
                className="group rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 p-6 border border-gray-200 hover:border-gray-300 hover:-translate-y-1 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className={`${resource.color} p-3 rounded-xl shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {resource.title}
                      </h3>
                      <ExternalLink className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {resource.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Links (WHITE BG REMOVED ONLY) */}
        <div className="rounded-2xl p-8 border border-gray-200 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900">
              Quick Links
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickLinks.map((link, idx) => {
              const Icon = link.icon;
              return (
                <Link
                  key={idx}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-blue-300 transition-all"
                >
                  <div className="p-2 rounded-lg border border-gray-200">
                    <Icon className="w-5 h-5 text-gray-700 group-hover:text-blue-600 transition-colors" />
                  </div>

                  <span className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                    {link.title}
                  </span>

                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors ml-auto" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Help Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 shadow-xl">
          <h3 className="text-2xl font-bold text-white mb-3">
            Need Help?
          </h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Join the developer community or contact support for assistance with your integration
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="https://developers.facebook.com/community"
              target="_blank"
              className="px-6 py-3 bg-white text-blue-600 font-medium rounded-xl"
            >
              Developer Community
            </Link>
            <Link
              href="https://developers.facebook.com/support"
              target="_blank"
              className="px-6 py-3 bg-blue-700 text-white font-medium rounded-xl"
            >
              Contact Support
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
