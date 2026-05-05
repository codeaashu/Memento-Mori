import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ActivityStats, LifeData, CountryLifeExpectancy } from "../types";
import {
  COUNTRY_DATA,
  calculateActivityStats,
  calculateLifeData,
} from "../lib/life-logic";
import RetroCard from "../components/retro-card";
import WeeksGrid from "../components/week-grid";
import SearchableSelect from "../components/searchable-select";
import StatsDashboard from "../components/status-dashboard";
import DatePicker from "../components/DatePicker";

export const Route = createFileRoute("/moneto")({
  component: RouteComponent,
});

function RouteComponent() {
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryLifeExpectancy>(
    COUNTRY_DATA.find((c) => c.code === "IND") || COUNTRY_DATA[0],
  );
  const [lifeData, setLifeData] = useState<LifeData | null>(null);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calculation Effect
  useEffect(() => {
    if (!birthDate) {
      setErrorMessage(null);
      setLifeData(null);
      setStats(null);
      return;
    }

    const date = birthDate as Date;

    // Check for valid date format
    if (isNaN(date.getTime())) {
      setErrorMessage(
        "ERROR: INVALID_FORMAT. System cannot parse temporal data.",
      );
      setLifeData(null);
      setStats(null);
      return;
    }

    const now = new Date();
    const yearsDiff =
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    // 1. Future Date Check
    if (date.getTime() > now.getTime()) {
      setErrorMessage(
        "FATAL: TIME_TRAVEL_DETECTED. 💀 Bro is literally trying to view stats before spawning in. Stop trolling.",
      );
      setLifeData(null);
      setStats(null);
      return;
    }

    // 2. Age < 10 Check
    if (yearsDiff < 10) {
      setErrorMessage(
        "ALERT: IPAD_KID_DETECTED. 💀 No way blud is under 10. Go finish your homework or watch skibidi toilet. You're too young for this existential dread.",
      );
      setLifeData(null);
      setStats(null);
      return;
    }

    // 3. Age > 110 Check (Legacy/Unc Check)
    if (yearsDiff > 110) {
      setErrorMessage(
        "SYSTEM ERROR: ANCIENT_ENTITY. 💀 Okay Unc, let's get you back to bed. There is no way you are this old. Stop the cap.",
      );
      setLifeData(null);
      setStats(null);
      return;
    }

    // If valid
    setErrorMessage(null);

    const data = calculateLifeData(date, selectedCountry.expectancy);
    const activityStats = calculateActivityStats(data);

    setLifeData(data);
    setStats(activityStats);

    // Trigger a re-render animation effect implies calculation load
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 600);
    return () => clearTimeout(timer);
  }, [birthDate, selectedCountry]);

  const handleCountryChange = (code: string) => {
    const country = COUNTRY_DATA.find((c) => c.code === code);
    if (country) setSelectedCountry(country);
  };

  return (
    <div className="min-h-screen bg-terminal-black p-4 md:p-8 font-mono selection:bg-terminal-red selection:text-white ">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero / Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-800 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-header font-bold text-white tracking-tighter flex items-center gap-3">
              <span className="w-4 h-4 bg-terminal-red block animate-pulse"></span>
              Memento Mori
            </h1>
            <p className="text-terminal-text text-sm mt-2 max-w-lg">
              system.init(mortality_visualizer); <br />
              Quantifying the finite nature of existence.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-terminal-text border border-neutral-800 p-2">
            <span>v.1</span>
            <span className="text-terminal-red">● LIVE</span>
          </div>
        </header>

        {/* Input Section */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4">
            <RetroCard title="Input Parameters" className="h-full">
              <div className="space-y-6">
                {/* Date Input */}
                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-widest text-neutral-500">
                    Date of Birth
                  </label>
                  <DatePicker
                    birthDate={birthDate}
                    setBirthDate={setBirthDate}
                  />
                  {errorMessage && (
                    <div className="text-[10px] leading-tight text-terminal-red font-bold mt-2 border-l-2 border-terminal-red pl-2 py-1 bg-terminal-red-dim/10 animate-pulse">
                      {errorMessage}
                    </div>
                  )}
                </div>

                {/* Country Input */}
                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-widest text-neutral-500">
                    Region (Life Expectancy)
                  </label>
                  <div className="relative">
                    <SearchableSelect
                      options={COUNTRY_DATA}
                      value={selectedCountry.code}
                      onChange={handleCountryChange}
                      placeholder="Search region or code"
                      id="country-select"
                    />
                  </div>
                </div>

                {lifeData && (
                  <div className="pt-6 mt-4 border-t border-dashed border-neutral-800 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500">
                        Compared to expectancy:
                      </span>
                      <span className="text-white">
                        {lifeData.weeksRemainingSigned > 0 ? (
                          <span className="text-neutral-300">
                            {Math.floor(lifeData.weeksRemainingSigned / 52)}{" "}
                            years below average
                          </span>
                        ) : lifeData.weeksSurpassed > 0 ? (
                          <span className="text-emerald-400">
                            Exceeded average by{" "}
                            {Math.floor(lifeData.weeksSurpassed / 52)} years
                          </span>
                        ) : (
                          <span className="text-neutral-300">At average</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500">Age:</span>
                      <span className="text-white">
                        {lifeData.yearsLived} years
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500">Percentage:</span>
                      <span className="text-white">
                        {lifeData.percentageLived.toFixed(1)}%{" "}
                        {lifeData.percentageLived > 100
                          ? "(surpassed)"
                          : "of avg"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </RetroCard>
          </div>

          {/* Main Metric - Weeks Left */}
          <div className="md:col-span-8">
            <RetroCard
              title="Life Clock"
              redBorder={!!lifeData}
              className="h-full flex flex-col justify-center"
              headerAction={
                lifeData ? "CALCULATION_COMPLETE" : "AWAITING_INPUT"
              }
            >
              {lifeData ? (
                <div
                  className={`flex flex-col items-center justify-center h-full text-center transition-opacity duration-500 ${isAnimating ? "opacity-50 blur-sm" : "opacity-100"}`}
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 w-full">
                    <div className="text-center group cursor-default">
                      <p className="text-xs text-neutral-500 mb-2 uppercase tracking-widest">
                        Weeks Lived
                      </p>
                      <p className="text-3xl md:text-5xl font-bold text-neutral-700 group-hover:text-white transition-colors">
                        {lifeData.weeksLived.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center group cursor-default">
                      <p
                        className={`text-xs mb-2 uppercase tracking-widest ${lifeData.weeksRemainingSigned > 0 ? "text-terminal-red" : "text-neutral-400"}`}
                      >
                        {lifeData.weeksRemainingSigned > 0
                          ? "Weeks Left"
                          : "Weeks Past Avg"}
                      </p>
                      <p
                        className={`text-3xl md:text-5xl font-bold ${lifeData.weeksRemainingSigned > 0 ? "text-terminal-red drop-shadow-[0_0_10px_rgba(255,42,42,0.5)]" : "text-neutral-400"}`}
                      >
                        {lifeData.weeksRemainingSigned > 0
                          ? lifeData.weeksRemaining.toLocaleString()
                          : lifeData.weeksSurpassed.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center col-span-2 md:col-span-1 group cursor-default">
                      <p className="text-xs text-neutral-500 mb-2 uppercase tracking-widest">
                        {lifeData.weeksRemainingSigned > 0
                          ? "Days Left"
                          : "Days Past Avg"}
                      </p>
                      <p className="text-3xl md:text-5xl font-bold text-neutral-700 group-hover:text-white transition-colors">
                        {Math.abs(
                          lifeData.weeksRemainingSigned * 7,
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-12 w-full bg-neutral-900 h-1 relative overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-terminal-red shadow-[0_0_15px_rgba(255,42,42,0.8)]"
                      style={{
                        width: `${Math.min(100, lifeData.percentageLived)}%`,
                      }}
                    ></div>
                    {lifeData.percentageLived > 100 && (
                      <div className="absolute right-0 top-0 -translate-y-6 text-[11px] bg-neutral-800 text-emerald-400 px-2 py-1 rounded-md">
                        Surpassed by{" "}
                        {(lifeData.percentageLived - 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <div className="w-full flex justify-between text-[10px] text-neutral-600 mt-2 font-mono">
                    <span>BIRTH</span>
                    <span>EST. DEATH</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-neutral-700 text-sm text-center px-6">
                  {errorMessage ? (
                    <span className="text-terminal-red/50">
                      {errorMessage.split(".")[0]}
                    </span>
                  ) : (
                    <span>&lt; WAITING FOR BIOLOGICAL DATA &gt;</span>
                  )}
                </div>
              )}
            </RetroCard>
          </div>
        </section>

        {/* Visualizations */}
        {lifeData && stats && (
          <>
            {/* Grid Visual */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <RetroCard title="Visual Timeline (1 Square = 1 Week)">
                <WeeksGrid data={lifeData} />
              </RetroCard>
            </section>

            {/* Stats Charts */}
            <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              <StatsDashboard stats={stats} age={lifeData.yearsLived} />
            </section>
          </>
        )}

        {/* Footer / Philosophy */}
        <footer className="border-t border-neutral-800 pt-8 pb-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="text-xs text-neutral-600 space-y-4">
            <p className="max-w-md">
              "It is not that we have a short time to live, but that we waste a
              lot of it. Life is long enough, and a sufficiently generous amount
              has been given to us for the highest achievements if it were all
              well invested."
            </p>
            <p className="font-bold">— Seneca</p>
          </div>
          <div className="flex flex-col items-start md:items-end text-xs text-neutral-700 font-mono">
            <p>DATA SOURCE: WHO 2023</p>
            <p>LOCALE: {selectedCountry.name}</p>
            <p className="mt-2">
              This visualization uses population averages — individual lifespans
              vary.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
