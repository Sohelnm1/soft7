"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ChartDataset {
  data: number[];
  backgroundColor?: string[];
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

interface ContactPieChartProps {
  data: ChartData;
}

export function ContactPieChart({ data }: ContactPieChartProps) {
  // Helper function to capitalize first letter
  const capitalizeFirst = (str: string) => {
    if (!str) return "Unknown";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Convert Chart.js-like data into Recharts-friendly format
  const pieData =
    data?.labels?.map((label, i) => ({
      name: capitalizeFirst(label),
      value: data.datasets[0]?.data[i] ?? 0,
    })) || [];

  // Filter out entries with 0 value for cleaner visualization
  const filteredPieData = pieData.filter((item) => item.value > 0);

  const colors = data.datasets[0]?.backgroundColor || [
    "#2563eb",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  if (filteredPieData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={filteredPieData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          innerRadius={0}
          labelLine={false}
          label={false}
        >
          {filteredPieData.map((_, i) => (
            <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: "10px",
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
          }}
          formatter={(value: any) => [
            `${value} contacts`,
            "Count",
          ]}
        />
        <Legend
          verticalAlign="top"
          height={36}
          wrapperStyle={{ paddingBottom: "20px" }}
          formatter={(value, entry: any) => {
            const total = filteredPieData.reduce((sum, item) => sum + item.value, 0);
            const percentage = total > 0 ? ((entry.payload.value / total) * 100).toFixed(0) : 0;
            return `${value}: ${percentage}%`;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}