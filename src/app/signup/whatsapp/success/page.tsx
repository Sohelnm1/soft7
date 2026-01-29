"use client";

import { useEffect, useState, Suspense } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SignupSuccessContent() {
  const searchParams = useSearchParams();
  const accountId = searchParams.get("account_id");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading to show success animation
    setTimeout(() => setLoading(false), 1500);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Completing setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 py-12 px-4">
      <div className="max-w-2xl mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-emerald-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Successfully Connected!
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Your WhatsApp Business Account has been successfully connected.
            You've received <span className="font-bold text-emerald-600">100 free credits</span> to get started!
          </p>

          <div className="bg-emerald-50 rounded-xl p-6 mb-8">
            <h2 className="font-semibold text-gray-900 mb-4">What's Next?</h2>
            <ul className="space-y-3 text-left">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  Start sending messages to your contacts
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  Create message templates for your business
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  Set up automated workflows and campaigns
                </span>
              </li>
            </ul>
          </div>

          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/inbox"
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
            >
              View Inbox
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignupSuccessContent />
    </Suspense>
  );
}
