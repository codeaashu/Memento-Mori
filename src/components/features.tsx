import { Clock, Grid3X3, PieChart, Sparkles } from "lucide-react";
export function Features() {
  const features = [
    {
      icon: Clock,
      title: "LIFE_CLOCK",
      description:
        "Weeks lived vs. weeks remaining based on your region's life expectancy data from WHO 2023.",
      stat: "4,000",
      statLabel: "AVG_WEEKS",
    },
    {
      icon: Grid3X3,
      title: "VISUAL_TIMELINE",
      description:
        "Every square represents one week of your life. See your entire existence at a glance.",
      stat: "1 WEEK",
      statLabel: "PER_SQUARE",
    },
    {
      icon: PieChart,
      title: "TIME_DISTRIBUTION",
      description:
        "How your remaining time breaks down: sleep, work, commute, and precious quality time.",
      stat: "60%",
      statLabel: "CONSUMED",
    },
    {
      icon: Sparkles,
      title: "LIFE_PHASE",
      description:
        "From Early Years to Bonus Time. Know where you stand in your journey through existence.",
      stat: "7",
      statLabel: "PHASES",
    },
  ];
  return (
    <div className="mb-16">
      <div className="flex items-center gap-3 mb-8">
        <span className="w-2 h-2 bg-[#dc2626]"></span>
        <span className="text-xs tracking-[0.3em] text-[#737373]">
          SYSTEM_FEATURES
        </span>
        <div className="flex-1 h-px bg-neutral-800"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <div
            key={feature.title}
            className="group relative border border-neutral-800 p-6 hover:border-[#dc2626]/50 transition-colors"
          >
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-[#dc2626] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-[#dc2626] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-[#dc2626] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-[#dc2626] opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border border-neutral-800 flex items-center justify-center group-hover:border-[#dc2626]/50 transition-colors">
                  <feature.icon className="w-5 h-5 text-[#dc2626]" />
                </div>
                <div>
                  <span className="text-[#525252] text-xs">0{index + 1}</span>
                  <h3 className="text-[#e5e5e5] text-sm tracking-wider">
                    {feature.title}
                  </h3>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[#dc2626] text-lg font-bold">
                  {feature.stat}
                </div>
                <div className="text-[#525252] text-xs tracking-wider">
                  {feature.statLabel}
                </div>
              </div>
            </div>

            <p className="text-[#737373] text-sm leading-relaxed">
              {feature.description}
            </p>

            {/* Bottom line accent */}
            <div className="absolute bottom-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-[#dc2626]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>
    </div>
  );
}
