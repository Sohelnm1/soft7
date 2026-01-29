"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export default function WhatsAppSignupPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appId, setAppId] = useState<string>("");
  const [redirectUri, setRedirectUri] = useState<string>("");
  const [state, setState] = useState<string>("");

  useEffect(() => {
    // Fetch app configuration (includes state for logged-in user so account is linked to them)
    fetch("/api/whatsapp/embedded-signup/public-config")
      .then((res) => res.json())
      .then((data) => {
        if (data.appId) {
          setAppId(data.appId);
          setRedirectUri(data.redirectUri || "");
          setState(data.state || "");
          initializeFacebookSDK(data.appId);
        } else {
          setError("App configuration not found");
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load config:", err);
        setError("Failed to load signup configuration");
        setLoading(false);
      });
  }, []);

  const [sdkReady, setSdkReady] = useState(false);

  const initializeFacebookSDK = (appId: string) => {
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: appId,
        xfbml: true,
        version: "v22.0",
      });
      setLoading(false);
      setSdkReady(true);
    };

    // Load Facebook SDK
    (function (d, s, id) {
      var js: HTMLScriptElement,
        fjs = d.getElementsByTagName(s)[0] as HTMLScriptElement;
      if (d.getElementById(id)) return;
      js = d.createElement(s) as HTMLScriptElement;
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      if (fjs && fjs.parentNode) {
        fjs.parentNode.insertBefore(js, fjs);
      }
    })(document, "script", "facebook-jssdk");
  };

  // Parse XFBML so the embedded signup widget renders (required when div is added by React)
  useEffect(() => {
    if (!sdkReady || !appId || typeof window === "undefined") return;
    const timer = setTimeout(() => {
      const container = document.getElementById("embedded-signup-container");
      if (window.FB?.XFBML?.parse && container) {
        window.FB.XFBML.parse(container);
      } else if (window.FB?.XFBML?.parse) {
        window.FB.XFBML.parse();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [sdkReady, appId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading signup form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-12 h-12 text-emerald-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Connect Your WhatsApp Business Account
            </h1>
            <p className="text-gray-600">
              Sign up to start using WhatsApp Business Platform and get started
              with messaging
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              What you'll get:
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  Instant access to WhatsApp Business Platform
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  Free credits to get started (100 credits)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  Send and receive messages through WhatsApp
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  Access to templates and automation features
                </span>
              </li>
            </ul>
          </div>

          {/* Embedded Signup Widget - SDK replaces this div with the actual button */}
          <div
            id="embedded-signup-container"
            className="text-center min-h-[120px]"
          >
            <div
              className="fb-messenger-embedded-signup"
              data-app-id={appId}
              data-redirect-uri={
                redirectUri ||
                (typeof window !== "undefined"
                  ? `${window.location.origin}/api/whatsapp/embedded-signup/callback`
                  : "")
              }
              {...(state ? { "data-state": state } : {})}
            />
          </div>
          {/* Fallback: if widget doesn't show (e.g. localhost), show helpful message + link */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-gray-500">
              If the button above doesn&apos;t appear: the page must be on a
              domain allowed in Meta (Facebook Login for Business → Allowed
              Domains). Testing on <strong>localhost</strong>? Add{" "}
              <code className="bg-gray-100 px-1 rounded">
                http://localhost:3000
              </code>{" "}
              there, or use production:{" "}
              <a
                href="https://soft7.wapsuite.in/signup/whatsapp"
                className="text-emerald-600 hover:underline"
              >
                https://soft7.wapsuite.in/signup/whatsapp
              </a>
            </p>
            {typeof window !== "undefined" && (
              <a
                href={`https://www.facebook.com/v22.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(`${window.location.origin}/api/whatsapp/embedded-signup/callback`)}&response_type=code&scope=whatsapp_business_management,whatsapp_business_messaging,business_management`}
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition"
              >
                Connect with WhatsApp Business (direct link)
              </a>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
          <p className="text-sm text-gray-600">
            By signing up, you agree to our Terms of Service and Privacy Policy.
            Your WhatsApp Business Account will be connected securely through
            Meta's official Embedded Signup process.
          </p>
        </div>
      </div>
    </div>
  );
}
