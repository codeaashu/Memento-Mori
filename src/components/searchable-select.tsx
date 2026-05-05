import React, { useEffect, useMemo, useRef, useState } from "react";
import { CountryLifeExpectancy } from "../types";

interface SearchableSelectProps {
  options: CountryLifeExpectancy[];
  value: string; // selected country code
  onChange: (code: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
}

/**
 * SearchableSelect
 *
 * - Shows only the country name when closed (concise).
 * - When opened, shows the full label (name + expectancy) and allows searching/filtering.
 * - Keyboard accessible (ArrowUp / ArrowDown / Enter / Escape).
 * - Click outside closes the list.
 * - Inline chevron inside the input and a separator to match the date picker's UI.
 */
const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select region...",
  id,
  className = "",
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState<number>(0);

  // Derive selected option
  const selected = useMemo(
    () => options.find((o) => o.code === value) || null,
    [options, value],
  );

  // Sync input display:
  // - When closed: show only country name (concise)
  // - When open: show full label (name + expectancy) if selection exists, otherwise user's typed query
  useEffect(() => {
    if (selected) {
      if (!open) {
        setQuery(selected.name);
      } else {
        // show full label while open
        setQuery(`${selected.name} (${selected.expectancy} yrs)`);
      }
    } else {
      if (!open) setQuery("");
      // when open and no selection, keep whatever the user types
    }
    // reset highlight when selected changes
    setHighlight(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, open]);

  // Filter options based on query but only when open (so closed state shows all implicitly)
  const filtered = useMemo(() => {
    const q = open ? query.trim().toLowerCase() : "";
    if (!q) return options;
    return options.filter((o) => {
      return (
        o.name.toLowerCase().includes(q) ||
        o.code.toLowerCase().includes(q) ||
        String(o.expectancy).toLowerCase().includes(q)
      );
    });
  }, [options, query, open]);

  // Keep highlight within bounds
  useEffect(() => {
    setHighlight((h) =>
      Math.max(0, Math.min(h, Math.max(0, filtered.length - 1))),
    );
  }, [filtered.length]);

  // Click outside to close
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Keyboard handling
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.min(highlight + 1, filtered.length - 1);
      setHighlight(next);
      setOpen(true);
      scrollToHighlighted(next);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = Math.max(highlight - 1, 0);
      setHighlight(prev);
      setOpen(true);
      scrollToHighlighted(prev);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && filtered[highlight]) {
        selectOption(filtered[highlight]);
      } else {
        setOpen((o) => !o);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      // restore concise label when closing
      if (selected) setQuery(selected.name);
      else setQuery("");
    }
  };

  const scrollToHighlighted = (index: number) => {
    const list = listRef.current;
    if (!list) return;
    const child = list.children[index] as HTMLElement | undefined;
    if (!child) return;
    const childTop = child.offsetTop;
    const childBottom = childTop + child.offsetHeight;
    if (childTop < list.scrollTop) list.scrollTop = childTop;
    else if (childBottom > list.scrollTop + list.clientHeight) {
      list.scrollTop = childBottom - list.clientHeight;
    }
  };

  const selectOption = (opt: CountryLifeExpectancy) => {
    onChange(opt.code);
    setOpen(false);
    // show only the country name when closed for concise display
    setQuery(opt.name);
    inputRef.current?.focus();
  };

  const onInputChange = (val: string) => {
    setQuery(val);
    if (!open) setOpen(true);
    setHighlight(0);
  };

  return (
    <div
      ref={rootRef}
      className={`relative w-full ${className}`}
      aria-haspopup="listbox"
    >
      <div className="relative group">
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={id ? `${id}-listbox` : undefined}
          aria-autocomplete="list"
          value={query}
          placeholder={placeholder}
          onChange={(e) => onInputChange(e.target.value)}
          onClick={() => setOpen(true)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={`w-full bg-neutral-900 border ${open ? "border-terminal-red" : "border-neutral-700"} text-white p-3 pr-12 font-mono rounded focus:outline-none focus:border-terminal-red transition-colors`}
        />

        {/* Separator between input text and icon */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 h-5 w-px bg-neutral-700/40 group-hover:bg-neutral-500 pointer-events-none" />

        {/* Inline chevron */}
        <button
          type="button"
          aria-label={open ? "Close options" : "Open options"}
          onClick={() => {
            setOpen((o) => !o);
            // focus input when opening for keyboard users
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 group-hover:text-white pointer-events-auto p-1 rounded transition-all ${open ? "bg-neutral-800 text-white" : "group-hover:bg-neutral-800"}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            viewBox="0 0 20 20"
            className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              d="M6 8l4 4 4-4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          ref={listRef}
          id={id ? `${id}-listbox` : undefined}
          role="listbox"
          aria-activedescendant={
            filtered[highlight]
              ? `${id}-option-${filtered[highlight].code}`
              : undefined
          }
          className="absolute z-50 mt-2 w-full max-h-56 overflow-auto rounded bg-neutral-900 border border-neutral-700 shadow-lg"
        >
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-neutral-500">No results</div>
          ) : (
            filtered.map((opt, idx) => {
              const isHighlighted = idx === highlight;
              const isSelected = opt.code === value;
              return (
                <div
                  id={id ? `${id}-option-${opt.code}` : undefined}
                  key={opt.code}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlight(idx)}
                  onMouseDown={(e) => {
                    // onMouseDown to avoid losing input focus before click
                    e.preventDefault();
                    selectOption(opt);
                  }}
                  className={`flex justify-between items-center gap-2 px-3 py-2 cursor-pointer text-sm transition-colors ${
                    isHighlighted ? "bg-neutral-800" : "hover:bg-neutral-800"
                  } ${isSelected ? "text-terminal-red font-bold" : "text-white"}`}
                >
                  <div className="flex flex-col">
                    <span className="font-mono">{opt.name}</span>
                    <span className="text-xs text-neutral-500">
                      {opt.code} · {opt.expectancy} yrs
                    </span>
                  </div>
                  {isSelected && (
                    <span className="text-terminal-red text-xs">Selected</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
