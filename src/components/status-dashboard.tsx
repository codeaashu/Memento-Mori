import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ActivityStats, ActivityType } from "../types";
import RetroCard from "../components/retro-card";

interface StatsDashboardProps {
  stats: ActivityStats;
  age: number;
}

const COLORS = [
  "#1a1a1a",
  "#2a2a2a",
  "#3a3a3a",
  "#4a0f0f",
  "#ff2a2a",
  "#cc2222",
  "#991919",
  "#ffffff",
];

const StatsDashboard: React.FC<StatsDashboardProps> = ({ stats, age }) => {
  const formatHours = (hours: number) => {
    const years = (hours / 24 / 365.25).toFixed(1);
    return `${parseInt(hours.toString()).toLocaleString()}h (~${years} yrs)`;
  };

  const data = [
    { name: ActivityType.SLEEP, value: stats.sleep, color: "#111111" },
    { name: ActivityType.WORK, value: stats.work, color: "#333333" },
    { name: ActivityType.COMMUTE, value: stats.commute, color: "#555555" },
    { name: ActivityType.CHORES, value: stats.chores, color: "#777777" },
    { name: ActivityType.EATING, value: stats.eating, color: "#4a0f0f" }, // Dark red
    { name: ActivityType.BATHROOM, value: stats.bathroom, color: "#7a1515" },
    { name: ActivityType.GROOMING, value: stats.grooming, color: "#a81c1c" },
    { name: ActivityType.LEISURE, value: stats.leisure, color: "#ff2a2a" }, // Bright red
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-terminal-black border border-terminal-red p-2 text-xs font-mono shadow-lg">
          <p className="text-white mb-1">{payload[0].name}</p>
          <p className="text-terminal-text">{formatHours(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Visual Chart */}
      <RetroCard title="Time Distribution" className="h-[400px]">
        <div className="h-full w-full flex flex-col items-center justify-center">
          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-4 max-w-xs">
            <p className="text-xs font-mono text-terminal-text">
              <span className="text-terminal-red font-bold">Quality Time</span>{" "}
              represents the moments truly yours. Sleep and Work consume nearly{" "}
              <span className="text-terminal-red">60%</span> of existence.
            </p>
          </div>
        </div>
      </RetroCard>

      {/* Detailed Breakdown */}
      <RetroCard title="Consumption Analytics" redBorder>
        <div className="space-y-4 overflow-y-auto max-h-[320px] pr-2 custom-scrollbar">
          {data
            .sort((a, b) => b.value - a.value)
            .map((item) => (
              <div
                key={item.name}
                className="group flex items-center justify-between p-2 border-b border-neutral-900 hover:bg-neutral-900/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm font-mono text-neutral-400 group-hover:text-white transition-colors">
                    {item.name}
                  </span>
                </div>
                <span className="text-sm font-mono text-terminal-text font-bold">
                  {formatHours(item.value)}
                </span>
              </div>
            ))}

          <div className="pt-4 mt-4 border-t border-dashed border-terminal-red/30">
            <p className="text-xs font-mono text-terminal-red leading-relaxed">
              CRITICAL ALERT: The "Leisure" metric assumes you live to
              expectancy. Accidents, illness, or biological decay are not
              factored. Current efficiency rating:{" "}
              <span className="text-white underline">DEGRADING</span>.
            </p>
          </div>
        </div>
      </RetroCard>
    </div>
  );
};

export default StatsDashboard;
