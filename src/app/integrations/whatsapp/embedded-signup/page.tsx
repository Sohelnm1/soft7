"use client";

import { useState, useEffect } from "react";
import {
  Check,
  Loader2,
  ExternalLink,
  Copy,
  AlertCircle,
  Info,
  Settings,
} from "lucide-react";
import { toast } from "react-hot-toast";

type EmbeddedSignupConfig = {
  appId: string;
  businessId: string;
  redirectUri: string;
  state: string;
};

export default function EmbeddedSignupPage() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<EmbeddedSignupConfig | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    fetchConfig();
    // Set webhook URL based on current origin
    if (typeof window !== "undefined") {
      setWebhookUrl(
        `${window.location.origin}/api/whatsapp/embedded-signup/webhook`,
      );

      // Check for success/error in URL params
      const params = new URLSearchParams(window.location.search);
      if (params.get("success") === "true") {
        toast.success(
          "Embedded Signup completed successfully! Credits have been allocated.",
        );
      } else if (params.get("error")) {
        const err = params.get("error") || "";
        const message =
          err === "missing_params"
            ? "Signup was incomplete. Please try again from the signup page and complete the full flow."
            : err === "cancelled"
              ? "You cancelled the signup. You can try again when ready."
              : `Error: ${err}`;
        toast.error(message);
      }
    }
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/whatsapp/embedded-signup/config");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (error) {
      console.error("Failed to fetch config:", error);
    } finally {
      setLoading(false);
    }
  };

  const initializeSignup = async () => {
    setInitializing(true);
    try {
      const res = await fetch("/api/whatsapp/embedded-signup/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        setConfig(data);
        toast.success("Embedded Signup initialized successfully!");
      } else {
        toast.error(data.error || "Failed to initialize");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setInitializing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50/50">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          WhatsApp Embedded Signup Builder
        </h1>
        <p className="text-gray-500 mt-2 text-lg">
          Allow customers to onboard to WhatsApp Business Platform directly from
          your website
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Business Verification</h3>
            <Check className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-sm text-gray-600">
            Your business is verified and ready for Embedded Signup
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">App Review</h3>
            <Check className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-sm text-gray-600">
            App review completed. Ready for production use
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Integrity</h3>
            <Check className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-sm text-gray-600">
            Business integrity verified. Integration cleared
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 p-8 mb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Getting Started with WhatsApp Embedded Signup
            </h2>
            <p className="text-gray-600">
              Embedded Signup allows you to onboard customers to the WhatsApp
              Business Platform directly from your website. This includes
              necessary app setup operations and code examples you can copy and
              paste into your system.
            </p>
          </div>
        </div>

        {!config ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-emerald-900 mb-2">
                  Initialize Embedded Signup
                </h3>
                <p className="text-sm text-emerald-800 mb-4">
                  To get started, you need to initialize the Embedded Signup
                  configuration. This will set up the necessary parameters for
                  the signup flow.
                </p>
                <button
                  onClick={initializeSignup}
                  disabled={initializing}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                >
                  {initializing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <Settings className="w-5 h-5" />
                      Initialize Configuration
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Configuration Details */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-4">
                Configuration Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    App ID
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-mono">
                      {config.appId}
                    </code>
                    <button
                      onClick={() => copyToClipboard(config.appId)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <Copy className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Business ID
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-mono">
                      {config.businessId}
                    </code>
                    <button
                      onClick={() => copyToClipboard(config.businessId)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <Copy className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Redirect URI
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-mono">
                      {config.redirectUri}
                    </code>
                    <button
                      onClick={() => copyToClipboard(config.redirectUri)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <Copy className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Webhook Configuration */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-blue-900 mb-2">
                    Webhook Configuration Required
                  </h3>
                  <p className="text-sm text-blue-800 mb-4">
                    Add this webhook URL to your Meta App settings to receive
                    signup notifications:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white px-4 py-2 rounded-lg border border-blue-200 text-sm font-mono">
                      {webhookUrl}
                    </code>
                    <button
                      onClick={() => copyToClipboard(webhookUrl)}
                      className="p-2 hover:bg-blue-100 rounded-lg transition"
                    >
                      <Copy className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                  <p className="text-xs text-blue-700 mt-3">
                    Go to Meta for Developers → Your App → WhatsApp →
                    Configuration → Webhook
                  </p>
                </div>
              </div>
            </div>

            {/* Integration Code */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-4">
                Integration Options
              </h3>

              {/* Option 1: Direct Link */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-2">
                  Option 1: Direct Signup Page
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Link to our hosted signup page:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-mono">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/signup/whatsapp`
                      : "/signup/whatsapp"}
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `${typeof window !== "undefined" ? window.location.origin : ""}/signup/whatsapp`,
                      )
                    }
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <Copy className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Option 2: Embed Code */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">
                  Option 2: Embed Widget on Your Website
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Add this code to your website to enable Embedded Signup:
                </p>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-100">
                    {`<script>
  window.fbAsyncInit = function() {
    FB.init({
      appId: '${config.appId}',
      xfbml: true,
      version: 'v22.0'
    });
  };

  (function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));
</script>

<div 
  class="fb-messenger-embedded-signup"
  data-app-id="${config.appId}"
  data-redirect-uri="${config.redirectUri}"
></div>`}
                  </pre>
                </div>
                <button
                  onClick={() => {
                    const code = `<script>
  window.fbAsyncInit = function() {
    FB.init({
      appId: '${config.appId}',
      xfbml: true,
      version: 'v22.0'
    });
  };

  (function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));
</script>

<div 
  class="fb-messenger-embedded-signup"
  data-app-id="${config.appId}"
  data-redirect-uri="${config.redirectUri}"
></div>`;
                    copyToClipboard(code);
                  }}
                  className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Integration Code
                </button>
              </div>
            </div>

            {/* Documentation Link */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">
                    Need More Help?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Check out the official Meta documentation for detailed
                    integration instructions
                  </p>
                </div>
                <a
                  href="https://developers.facebook.com/docs/whatsapp/embedded-signup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition flex items-center gap-2"
                >
                  View Documentation
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
