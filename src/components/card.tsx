"use client";

import { useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  Users,
  MessageCircle,
  X,
  ShieldHalf,
} from "lucide-react";

interface CardProps {
  title: string;
  value: string;
  change: string;
  subtitle?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  value,
  change,
  subtitle,
}) => {
  const [showModal, setShowModal] = useState(false);
  const isPositive = change.startsWith("+");

  return (
    <>
      {/* Card */}
      <div
        className={`bg-white/90 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 flex flex-col justify-between relative overflow-hidden cursor-pointer 
                    hover:shadow-xl hover:scale-105 transition-all duration-300 border border-gray-100 dark:border-gray-700`}
        onClick={() => setShowModal(true)}
      >
        {/* Gradient Top Line */}
        <div
          className={`absolute top-0 left-0 w-full h-1 ${
            isPositive
              ? "bg-gradient-to-r from-green-400 to-green-600"
              : "bg-gradient-to-r from-red-400 to-red-600"
          }`}
        ></div>

        {/* Main Content */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-gray-500 dark:text-gray-400 font-medium text-sm">
              {title}
            </span>
            <h3 className="text-3xl font-bold mt-1 text-gray-900 dark:text-gray-100">
              {value}
            </h3>
          </div>
          <div className="text-gray-300 dark:text-gray-500">
            {title.includes("Messages") && <MessageCircle size={32} />}
            {title.includes("Contacts") && <Users size={32} />}
            {title.includes("team") && <ShieldHalf size={32} />}
          </div>
        </div>

        {/* Change and subtitle */}
        <div className="flex items-center gap-2 text-sm">
          {isPositive ? (
            <ArrowUp className="text-green-500 w-4 h-4" />
          ) : (
            <ArrowDown className="text-red-500 w-4 h-4" />
          )}
          <span
            className={`${
              isPositive ? "text-green-500" : "text-red-500"
            } font-medium`}
          >
            {change} {subtitle}
          </span>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-2xl min-w-[300px] max-w-md relative transform scale-90 animate-scaleUp border border-gray-100 dark:border-gray-700 transition-colors duration-300"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
          >
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => setShowModal(false)}
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">
              {title}
            </h2>
            <p className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              {value}
            </p>
            <div className="flex items-center gap-2 mb-2">
              {isPositive ? (
                <ArrowUp className="text-green-500 w-4 h-4" />
              ) : (
                <ArrowDown className="text-red-500 w-4 h-4" />
              )}
              <span
                className={`${
                  isPositive ? "text-green-500" : "text-red-500"
                } font-medium`}
              >
                {change} {subtitle}
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              Additional details, charts or metrics can go here...
            </p>
          </div>
        </div>
      )}
    </>
  );
};
