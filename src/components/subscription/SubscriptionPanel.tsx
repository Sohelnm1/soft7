"use client";

import { X, Crown, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

interface SubscriptionData {
  plan: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface SubscriptionPanelProps {
  subscriptionData: SubscriptionData | null;
  onClose: () => void;
}

export default function SubscriptionPanel({
  subscriptionData,
  onClose,
}: SubscriptionPanelProps) {
  const isPremium = subscriptionData?.status === "active";



  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6 text-yellow-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Subscription
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isPremium ? (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 shrink-0" />
                <div>
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    Premium Active
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Enjoy all premium features
                  </p>
                </div>
              </div>

              {/* Plan Details */}
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Current Plan
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                    {subscriptionData?.plan}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Started
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {subscriptionData?.startDate
                        ? new Date(
                            subscriptionData.startDate
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Renews
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {subscriptionData?.endDate
                        ? new Date(subscriptionData.endDate).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Plan Features
                </h3>
                <div className="space-y-2">
                  {[
                    "Unlimited contacts",
                    "Advanced analytics",
                    "Priority support",
                    "Custom workflows",
                    "Team collaboration",
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link href="/subscription">
                  <button className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg transition">
                    Upgrade Plan
                  </button>
                </Link>
                <button className="w-full py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition">
                  Manage Billing
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* No Subscription */}
              <div className="flex items-center gap-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 shrink-0" />
                <div>
                  <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                    No Active Subscription
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Upgrade to premium now
                  </p>
                </div>
              </div>

              {/* Plans Overview */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Available Plans
                </h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Starter
                    </span>{" "}
                    - ₹999/month
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Professional
                    </span>{" "}
                    - ₹2,999/month
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Enterprise
                    </span>{" "}
                    - ₹9,999/month
                  </p>
                </div>
              </div>

              {/* CTA Button */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link href="/subscription">
                  <button className="w-full py-3 bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-lg transition shadow-lg">
                    View All Plans
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800">
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
            Secure payments powered by Razorpay
          </p>
        </div>
      </div>
    </>
  );
}
