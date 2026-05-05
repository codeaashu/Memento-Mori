"use client";

import type { Dispatch, SetStateAction } from "react";
import { useState, useMemo } from "react";
import { format, setMonth, setYear } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DatePickerProps {
  birthDate: Date | null;
  setBirthDate: Dispatch<SetStateAction<Date | null>>;
  /**
   * Optional className applied to the trigger button
   */
  className?: string;
  /**
   * Optional placeholder shown when no date is selected
   */
  placeholder?: string;
}

/**
 * DatePicker
 *
 * A standalone date picker component that encapsulates the popover, month/year
 * selects and the calendar. This component intentionally replicates the
 * date-picker logic and UI wiring from the provided implementation but keeps
 * the API minimal (only the birthDate + setter are required).
 */
export function DatePicker({
  birthDate,
  setBirthDate,
  className,
  placeholder = "Select your birth date",
}: DatePickerProps) {
  const [calendarMonth, setCalendarMonth] = useState<Date>(
    birthDate || new Date(2000, 0, 1),
  );
  const [open, setOpen] = useState(false);

  const months = useMemo(
    () => [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    [],
  );

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from(
      { length: current - 1900 + 1 },
      (_, i) => 1900 + i,
    ).reverse();
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-mono bg-[#141a14] border-[#1a2e1a] px-4 py-6 text-[#e5e5e5] hover:bg-[#1a2e1a] hover:text-[#e5e5e5] focus:border-[#dc2626] transition-colors",
            !birthDate && "text-[#525252]",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-[#dc2626]" />
          {birthDate ? format(birthDate, "MM / dd / yyyy") : placeholder}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-0 bg-[#0a0f0a] border-[#1a2e1a]"
        align="start"
      >
        <div className="flex items-center font-mono justify-between gap-2 p-3 border-b border-[#1a2e1a]">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-[#525252] hover:text-[#dc2626] hover:bg-[#1a2e1a]"
            onClick={() =>
              setCalendarMonth((prev) => setMonth(prev, prev.getMonth() - 1))
            }
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex gap-2 ">
            <Select
              value={calendarMonth.getMonth().toString()}
              onValueChange={(value) =>
                setCalendarMonth((prev) =>
                  setMonth(prev, Number.parseInt(value)),
                )
              }
            >
              <SelectTrigger className="w-[110px] h-8 bg-[#141a14] border-[#1a2e1a] text-[#e5e5e5] text-sm focus:ring-0 focus:ring-offset-0 focus:border-[#dc2626] font-mono">
                <SelectValue placeholder={months[calendarMonth.getMonth()]} />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0f0a] border-[#1a2e1a] max-h-[200px]">
                {months.map((month, index) => (
                  <SelectItem
                    key={month}
                    value={index.toString()}
                    className="text-[#e5e5e5] focus:bg-[#1a2e1a] focus:text-[#e5e5e5]"
                  >
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={calendarMonth.getFullYear().toString()}
              onValueChange={(value) =>
                setCalendarMonth((prev) =>
                  setYear(prev, Number.parseInt(value)),
                )
              }
            >
              <SelectTrigger className="w-20 h-8 bg-[#141a14] border-[#1a2e1a] text-[#e5e5e5] text-sm focus:ring-0 focus:ring-offset-0 focus:border-[#dc2626] ">
                <SelectValue
                  placeholder={calendarMonth.getFullYear().toString()}
                />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0f0a] border-[#1a2e1a] max-h-[200px]">
                {years.map((year) => (
                  <SelectItem
                    key={year}
                    value={year.toString()}
                    className="text-[#e5e5e5] focus:bg-[#1a2e1a] focus:text-[#e5e5e5]"
                  >
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-[#525252] hover:text-[#dc2626] hover:bg-[#1a2e1a]"
            onClick={() =>
              setCalendarMonth((prev) => setMonth(prev, prev.getMonth() + 1))
            }
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Calendar
          mode="single"
          selected={birthDate || undefined}
          onSelect={(date) => {
            setBirthDate(date || null);
            setOpen(false);
          }}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
          disabled={(date) =>
            date > new Date() || date < new Date("1900-01-01")
          }
          autoFocus
          classNames={{
            months:
              "flex flex-col font-mono sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 p-3",
            month: "space-y-4",
            caption: "hidden",
            nav: "hidden",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell:
              "text-[#525252] rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
            day: "h-9 w-9 p-0 font-normal text-[#e5e5e5] hover:bg-[#1a2e1a] hover:text-[#e5e5e5] rounded transition-colors",
            day_range_end: "day-range-end",
            day_selected:
              "bg-[#dc2626] text-white hover:bg-[#dc2626] hover:text-white focus:bg-[#dc2626] focus:text-white",
            day_today: "bg-[#1a2e1a] text-[#dc2626]",
            day_outside: "text-[#525252] opacity-50",
            day_disabled: "text-[#525252] opacity-50",
            day_hidden: "invisible",
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export default DatePicker;
