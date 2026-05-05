import { CyberCard } from "@/components/cyber-card";
import { Features } from "@/components/features";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Skull, Activity, Hourglass } from "lucide-react";
import { useState, useEffect } from "react";
export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const LANDING_ACCORDION_ITEMS = [
    {
      title: "THE PHILOSOPHY OF MEMENTO MORI",
      content: ` "You could leave life right now. Let that determine what you do and say and think." — Marcus Aurelius.

      Memento Mori is not about being morbid or fearful. It is a tool for radical clarity. By visualizing the finiteness of our time, we strip away the trivial and focus on the essential. It is the ancient practice of keeping death in mind to truly live.`,
    },
    {
      title: "THE 4,000 WEEKS REALITY",
      content:
        "The average human life is absurdly short—roughly 4,000 weeks. It sounds like a lot, until you see it laid out on a single screen. We often live as if we have an infinite scroll of days. The grid proves otherwise. Every red square is a week spent; every grey square is an opportunity remaining.",
    },
    {
      title: "URGENCY OVER ANXIETY",
      content:
        "Seneca wrote, 'It is not that we have a short time to live, but that we waste a lot of it.' This visualization is a mirror. If looking at it makes you uncomfortable, that is the point. Use that discomfort. Let it drive you to make the remaining squares count.",
    },
    {
      title: "IS THIS MEANT TO SCARE ME ?",
      content: `No. This is a wake-up call, not a death sentence. The goal is simple: do good, live fully, and when the time comes, leave with no regrets. Seneca said it best—"It is not that we have a short time to live, but that we waste a lot of it." See your time clearly. Use it wisely. Die happy.`,
    },
  ];

  const totalWeeks = 3000;
  const weeksPerRow = 150;
  const rows = Math.ceil(totalWeeks / weeksPerRow);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    // Set initial time
    setCurrentTime(new Date());
    setCurrentDate(
      new Date()
        .toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        })
        .toUpperCase(),
    );

    // Update every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date | null) => {
    if (!date) return { hours: "--", minutes: "--", seconds: "--" };

    const timeString = date.toLocaleTimeString(undefined, {
      // Your local timezone!
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true, // ✅ 12-hour format (AM/PM)
    });

    // Split "10:19:45 AM" → ["10", "19", "45 AM"]
    const parts = timeString.split(" ");
    const [hours, minutes, seconds] = parts[0].split(":");

    return {
      hours,
      minutes,
      seconds: parts[1] || seconds, // Include AM/PM if you want
    };
  };

  const time = formatTime(currentTime);

  return (
    <div className="min-h-screen bg-terminal-black text-[#e5e5e5] selection:bg-red-900 selection:text-white flex flex-col">
      {/*{time section}*/}

      <div className="fixed top-2 left-2 sm:left-6 sm:top-4 z-50">
        <div className="border border-[#1a2e1a] bg-[#0d1210]/90 backdrop-blur-sm p-1 relative flex justify-center items-center">
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-[#dc2626]" />
          <div className="absolute top-0 right-0 w-1 h-1 border-r border-t border-[#dc2626]" />
          <div className="absolute bottom-0 left-0 w-1 h- border-l border-b border-[#dc2626]" />
          <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-[#dc2626]" />

          <div className="flex items-center gap-1 text-sm  font-bold tracking-wider">
            <span className="text-[#e5e5e5]">{time.hours}</span>
            <span className="text-[#dc2626] animate-pulse">:</span>
            <span className="text-[#e5e5e5]">{time.minutes}</span>
            <span className="text-[#dc2626] animate-pulse">:</span>
            <span className="text-[#dc2626]">{time.seconds}</span>
          </div>
          <div className="text-sm tracking-[0.2em] text-[#525252] mt-1"></div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-18 md:pt-7 md:pb-20 px-6 overflow-hidden ">
        {/* Background Grid Effect */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1  border border-dashed  border-red-900/30 bg-red-900/10 text-red-500 text-[10px] tracking-[0.2em] font-mono uppercase mb-4 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            You Think you Have time ?
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-8xl font-bold tracking-tighter text-white leading-[0.9]">
            YOUR LIFE <br />
            <span className="text-transparent bg-clip-text bg-linear-to-b from-neutral-200 to-neutral-600">
              IN WEEKS
            </span>
          </h1>

          <p className="text-[#737373] text-sm  max-w-xl mx-auto mb-8 text-pretty leading-relaxed">
            Each square below is one week. Most of us get about 4,000.
            <br />
            <span className="text-[#525252]">How will you spend yours?</span>
          </p>

          <div className="relative ">
            {/* Grid label */}
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-xs tracking-[0.3em] text-[#525252]">
                BIRTH
              </span>
              <span className="text-xs tracking-[0.3em] text-[#525252] ">
                ~4,000 WEEKS
              </span>
              <span className="text-xs tracking-[0.3em] text-[#525252]">
                DEATH
              </span>
            </div>

            {/* The grid - each square is a week */}
            <div className="border border-[#1a2e1a] p-2 sm:p-4 bg-[#0d1210] relative overflow-x-auto ">
              <div
                className="grid gap-0.5 mx-auto w-full "
                style={{
                  gridTemplateColumns: `repeat(${weeksPerRow}, 1fr)`,
                }}
              >
                {Array.from({ length: totalWeeks }).map((_, index) => {
                  const isHighlighted = index < 1560;
                  const isCurrentWeek = index === 1560;

                  return (
                    <div
                      key={index}
                      className={`
                                  aspect-square w-full min-w-[2px] max-w-[4px] transition-colors
                                  ${
                                    isCurrentWeek
                                      ? "bg-[#e5e5e5] shadow-[0_0_8px_rgba(229,229,229,0.5)]"
                                      : isHighlighted
                                        ? "bg-[#dc2626]/80"
                                        : "bg-[#1a2e1a]/50 hover:bg-[#1a2e1a]"
                                  }
                                `}
                    />
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[#1a2e1a]">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#dc2626]/80"></div>
                  <span className="text-[10px] sm:text-xs text-[#737373]">
                    LIVED
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#e5e5e5]"></div>
                  <span className="text-[10px] sm:text-xs text-[#737373]">
                    NOW
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#1a2e1a]/50"></div>
                  <span className="text-[10px] sm:text-xs text-[#737373]">
                    REMAINING
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8">
            <Button
              size="lg"
              onClick={() => {}}
              className="group relative inline-flex items-center justify-center px-8 py-4 font-mono font-bold text-white transition-all duration-200 bg-neutral-900 border border-neutral-800 hover:border-red-600 hover:bg-red-900/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 focus:ring-offset-black"
            >
              <Link to="/moneto">
                <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-linear-to-b from-transparent via-transparent to-black"></span>
                <span className="relative flex items-center gap-3">
                  INITIALIZE VISUALIZATION{" "}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </Button>
            <p className="mt-4 text-[10px] text-neutral-600 font-mono uppercase tracking-widest">
              No Sign Up Required • It's just Maths
            </p>
          </div>
        </div>
      </section>

      {/* Feature Preview Section */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <Features />
        </div>
      </section>

      {/*{ Data trip }*/}
      <div className="flex items-center justify-center gap-8 mb-16 py-4 border-y border-neutral-800 border-dashed">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse"></span>
          <span className="text-xs tracking-wider text-[#525252]">
            DATA_SOURCE: WHO 2023
          </span>
        </div>
        <div className="w-px h-4 bg-[#1a2e1a]"></div>
        <span className="text-xs tracking-wider text-[#525252]">
          ALL REGION
        </span>
        <div className="w-px h-4 bg-[#1a2e1a]"></div>
        <span className="text-xs tracking-wider text-[#525252]">
          ACCURACY: STATISTICAL
        </span>
      </div>

      {/* Philosophy Section (Accordion) */}
      <section className="py-7 px-6 max-w-5xl mx-auto w-full">
        <div className="text-center  space-y-4">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-2 h-2 bg-[#dc2626]"></span>
            <span className="text-xs tracking-[0.3em] text-[#737373]">
              FREQUENTLY_ASKED
            </span>
            <div className="flex-1 h-px bg-[#1a2e1a]"></div>
          </div>
        </div>
        <CyberCard noPadding>
          <Accordion type="single" collapsible className="w-full">
            {LANDING_ACCORDION_ITEMS.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="px-6"
              >
                <AccordionTrigger>{item.title}</AccordionTrigger>
                <AccordionContent>{item.content}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CyberCard>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 text-center">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-6">
          <div className="text-[10px] text-neutral-600 font-mono uppercase tracking-[0.2em]">
            Memento Mori Project // v.0.1
          </div>
          <p className="text-neutral-500 text-sm max-w-md mx-auto">
            "We have two lives, and the second begins when we realize we only
            have one."
          </p>
        </div>
      </footer>
    </div>
  );
}
