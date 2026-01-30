"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

// Configuration from Meta Dashboard - Embedded Signup Builder
const CONFIG_ID = "399803713150682";
const APP_ID = "1323859021659502";
const SDK_VERSION = "v24.0";

interface SessionInfoResponse {
  type: string;
  event: string;
  data: {
    phone_number_id?: string;
    waba_id?: string;
    current_step?: string;
    error_message?: string;
  };
}

export default function WhatsAppSignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfoResponse | null>(null);
  const [sdkResponse, setSdkResponse] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get state token for user identification
  const [stateToken, setStateToken] = useState<string>("");

  useEffect(() => {
    // Fetch state token (for linking account to logged-in user)
    fetch("/api/whatsapp/embedded-signup/public-config")
      .then((res) => res.json())
      .then((data) => {
        if (data.state) {
          setStateToken(data.state);
        }
      })
      .catch(console.error);
  }, []);

  // Initialize Facebook SDK
  useEffect(() => {
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: APP_ID,
        autoLogAppEvents: true,
        xfbml: true,
        version: SDK_VERSION,
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
      js.crossOrigin = "anonymous";
      js.async = true;
      js.defer = true;
      if (fjs && fjs.parentNode) {
        fjs.parentNode.insertBefore(js, fjs);
      }
    })(document, "script", "facebook-jssdk");
  }, []);

  // Listen for messages from Facebook popup (Session Info)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") {
        return;
      }
      try {
        const data = JSON.parse(event.data) as SessionInfoResponse;
        if (data.type === "WA_EMBEDDED_SIGNUP") {
          console.log("WA_EMBEDDED_SIGNUP event received:", data);
          setSessionInfo(data);

          if (data.event === "FINISH") {
            const { phone_number_id, waba_id } = data.data;
            console.log("✅ Embedded Signup FINISH:", { phone_number_id, waba_id });
            // Note: The actual account creation happens on the backend via webhook + callback
          } else if (data.event === "CANCEL") {
            console.warn("Embedded Signup cancelled at step:", data.data.current_step);
            setError("Signup was cancelled. Please try again.");
          } else if (data.event === "ERROR") {
            console.error("Embedded Signup error:", data.data.error_message);
            setError(data.data.error_message || "An error occurred during signup");
          }
        }
      } catch {
        // Non-JSON messages, ignore
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // FB.login callback - handles the authorization code
  // Note: Must be a regular function (not async) as FB.login doesn't support async callbacks
  const fbLoginCallback = useCallback((response: any) => {
    console.log("FB.login response:", response);
    setSdkResponse(response);

    if (response.authResponse && response.authResponse.code) {
      const code = response.authResponse.code;
      console.log("Authorization code received, redirecting to callback...");
      setIsProcessing(true);

      // Send the code to our backend to exchange for access token
      const callbackUrl = `/api/whatsapp/embedded-signup/callback?code=${encodeURIComponent(code)}${stateToken ? `&state=${encodeURIComponent(stateToken)}` : ""}`;

      // Redirect to callback endpoint to complete the signup
      window.location.href = callbackUrl;
    } else if (response.status === "unknown") {
      // User cancelled login
      console.log("User cancelled login");
    } else {
      console.log("FB.login did not return authResponse");
    }
  }, [stateToken]);

  // Launch WhatsApp Embedded Signup using FB.login
  const launchWhatsAppSignup = () => {
    if (!sdkReady || !window.FB) {
      setError("Facebook SDK not ready. Please refresh the page.");
      return;
    }

    window.FB.login(fbLoginCallback, {
      config_id: CONFIG_ID,
      response_type: "code", // Required for System User access token
      override_default_response_type: true,
      extras: {
        version: "v3",
        setup: {
          business: {
            id: null,
            name: null,
            email: null,
            phone: { code: null, number: null },
            website: null,
            address: {
              streetAddress1: null,
              streetAddress2: null,
              city: null,
              state: null,
              zipPostal: null,
              country: null,
            },
            timezone: null,
          },
          phone: {
            displayName: null,
            category: null,
            description: null,
          },
          preVerifiedPhone: {
            ids: null,
          },
          solutionID: null,
          whatsAppBusinessAccount: {
            ids: null,
          },
        },
      },
    });
  };

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

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Setting up your WhatsApp Business account...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait, this may take a moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 py-12 px-4">
      <div id="fb-root"></div>
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

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

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

          {/* Embedded Signup Button */}
          <div className="text-center">
            <button
              onClick={launchWhatsAppSignup}
              disabled={!sdkReady}
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold text-white bg-[#1877f2] hover:bg-[#166fe5] transition disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {sdkReady ? "Login with Facebook" : "Loading..."}
            </button>
          </div>

          {/* Debug info (remove in production) */}
          {(sessionInfo || sdkResponse) && (
            <div className="mt-6 space-y-4 text-sm">
              {sessionInfo && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">Session Info Response:</p>
                  <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto text-xs">
                    {JSON.stringify(sessionInfo, null, 2)}
                  </pre>
                </div>
              )}
              {sdkResponse && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">SDK Response:</p>
                  <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto text-xs">
                    {JSON.stringify(sdkResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
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
