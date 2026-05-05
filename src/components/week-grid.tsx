import React, { useMemo } from "react";
import { LifeData } from "../types";

interface WeeksGridProps {
  data: LifeData;
}

const WeeksGrid: React.FC<WeeksGridProps> = ({ data }) => {
  const weeks = useMemo(() => {
    // Ensure the grid renders at least up to the user's current week so the current
    // week is always visible. Also allow rendering beyond the average expectancy
    // so 'bonus' weeks (weeks lived past the regional average) can be displayed.
    const maxCap = 5200; // ~100 years hard cap to avoid browser OOM
    const desiredTotal = Math.max(data.weeksTotal, data.weeksLived + 1);
    const safeTotal = Math.min(desiredTotal, maxCap);

    return Array.from({ length: safeTotal }, (_, i) => ({
      id: i,
      isLived: i < data.weeksLived,
      // Highlight the current week
      isCurrent: i === data.weeksLived,
      // Bonus weeks: those beyond the expected weeksTotal (surpassed average)
      isBonus: i >= data.weeksTotal,
    }));
  }, [data.weeksTotal, data.weeksLived]);

  return (
    <div className="w-full overflow-hidden">
      <div className="flex justify-between mb-4 font-mono text-xs text-neutral-500 uppercase tracking-wider">
        <span>Birth</span>
        <div className="flex gap-4">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-terminal-red opacity-80"></span> Lived
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-white animate-pulse"></span> Current
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500"></span> Bonus (past avg)
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-neutral-900"></span> Remaining
          </span>
        </div>
        <span>Death (Est.)</span>
      </div>

      {/*
                We use a flex layout with wrap instead of CSS Grid for the specific 'GitHub contribution' aesthetic
                where items flow naturally. 52 columns is hard to force responsibly on mobile, so we allow wrap.
                On large screens, we can try to enforce approx 52 cols width.
            */}
      <div
        className="flex flex-wrap content-start gap-[3px] opacity-90"
        style={{ maxWidth: "100%" }}
      >
        {weeks.map((week) => (
          <div
            key={week.id}
            className={`
                            w-[5px] h-[5px] sm:w-[6px] sm:h-[6px]
                            rounded-[1px] transition-all duration-300
                        `}
            title={
              week.isCurrent
                ? "Current Week"
                : week.isLived && week.isBonus
                  ? `Lived (past avg) — Week ${week.id + 1}`
                  : week.isLived
                    ? `Lived — Week ${week.id + 1}`
                    : week.isBonus
                      ? `Beyond avg — Week ${week.id + 1}`
                      : `Week ${week.id + 1}`
            }
          >
            <div
              className={`
                w-full h-full rounded-[1px] transition-all duration-300
                ${week.isCurrent ? "bg-white scale-150 shadow-[0_0_10px_rgba(255,255,255,0.8)] z-10" : week.isLived && week.isBonus ? "bg-emerald-500/95 hover:scale-125" : week.isLived ? "bg-terminal-red opacity-80 hover:opacity-100 hover:scale-125" : week.isBonus ? "bg-emerald-300/60 hover:scale-110" : "bg-neutral-900 hover:bg-neutral-700"}
              `}
            />
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-dashed border-neutral-800 font-mono text-xs text-neutral-600 flex justify-between">
        <p>
          Grid represents your estimated lifespan in weeks. Rendered squares
          include any bonus weeks past the regional average.
        </p>
        <p>
          {weeks.length} squares rendered · {data.weeksTotal} avg squares
        </p>
      </div>
    </div>
  );
};

export default WeeksGrid;
