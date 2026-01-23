"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTheme } from "next-themes";

interface ChartData {
  totalMessagesSent: number;
  totalMessagesReceived: number;
  totalContacts: number;
  teamAgents: number,
  leads: number[];
  sources: number[];
}

export function Chart() {
  const [conversionsData, setConversionsData] = useState<ChartData | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard");
        const result = await res.json();
        setConversionsData(result);

      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    }
    // every 5 seconds a request is being made
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // 🎨 Theme-based colors
  const isDark = theme === "dark";
  const gridColor = isDark ? "#374151" : "#e5e7eb"; // gray-700 vs gray-200
  const axisColor = isDark ? "#9ca3af" : "#4b5563"; // gray-400 vs gray-600
  const leadColor = "#2563eb"; // blue-600
  const convColor = "#10b981"; // emerald-500
  // prepare data for recharts
  const chartArray =
    conversionsData !== null
      ? [
          { name: "Messages Sent", value: conversionsData.totalMessagesSent },
          {
            name: "Messages Received",
            value: conversionsData.totalMessagesReceived,
          },
          { name: "Contacts", value: conversionsData.totalContacts },
          { name: "Agents", value: conversionsData.teamAgents },
        ]
      : [];
  return (
    <div className="w-full h-80 transition-colors duration-300">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          responsive
          data={chartArray}
          margin={{
            top: 20,
            right: 20,
            bottom: 5,
            left: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="name" stroke={axisColor} tick={{ fill: axisColor }} />
          <YAxis stroke={axisColor} tick={{ fill: axisColor }} />
          <Tooltip />
          <Legend verticalAlign="top" />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#2563eb"
            strokeWidth={3}
            dot={{ r: 5 }}
            activeDot={{ r: 8 }}
            name="Value"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
// <LineChart
//   data={data}
//   margin={{ top: 20, right: 20, bottom: 5, left: 0 }}
// >
//   <defs>
//     <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
//       <stop offset="0%" stopColor={leadColor} stopOpacity={0.4} />
//       <stop offset="100%" stopColor={leadColor} stopOpacity={0} />
//     </linearGradient>
//     <linearGradient id="convGradient" x1="0" y1="0" x2="0" y2="1">
//       <stop offset="0%" stopColor={convColor} stopOpacity={0.4} />
//       <stop offset="100%" stopColor={convColor} stopOpacity={0} />
//     </linearGradient>
//   </defs>

//   <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
//   <XAxis dataKey="name" stroke={axisColor} tick={{ fill: axisColor }} />
//   <YAxis stroke={axisColor} tick={{ fill: axisColor }} />
//   <Tooltip
//     contentStyle={{
//       backgroundColor: isDark ? "#1f2937" : "#ffffff",
//       border: "none",
//       borderRadius: "0.5rem",
//       color: isDark ? "#f3f4f6" : "#111827",
//     }}
//   />
//   <Legend
//     verticalAlign="top"
//     height={36}
//     wrapperStyle={{
//       color: axisColor,
//     }}
//   />
//   <Line
//     type="monotone"
//     dataKey="leads"
//     stroke={leadColor}
//     strokeWidth={3}
//     dot={{ r: 5 }}
//     activeDot={{ r: 8 }}
//     fillOpacity={1}
//     fill="url(#leadsGradient)"
//   />
//   <Line
//     type="monotone"
//     dataKey="conversions"
//     stroke={convColor}
//     strokeWidth={3}
//     dot={{ r: 5 }}
//     activeDot={{ r: 8 }}
//     fillOpacity={1}
//     fill="url(#convGradient)"
//   />
// </LineChart>
