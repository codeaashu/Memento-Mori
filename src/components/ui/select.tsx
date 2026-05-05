import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type SelectContextType = {
  value: string;
  onValueChange: (v: string) => void;
  registerItem: (value: string, label: string) => void;
  unregisterItem: (value: string) => void;
  open: boolean;
  // Accept both direct boolean and functional updater like React setState
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  highlightIndex: number;
  // Accept functional updater for highlight index
  setHighlightIndex: React.Dispatch<React.SetStateAction<number>>;
  itemsOrder: string[];
  // Allow functional updater for items order
  setItemsOrder: React.Dispatch<React.SetStateAction<string[]>>;
  // expose itemsMap so consumers (SelectValue) can resolve labels
  itemsMap: Record<string, string>;
};

const SelectContext = createContext<SelectContextType | null>(null);

export type SelectProps = {
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
};

export function Select({ value, onValueChange, children }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [itemsMap, setItemsMap] = useState<Record<string, string>>({});
  const [itemsOrder, setItemsOrder] = useState<string[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const registerItem = useCallback((val: string, label: string) => {
    setItemsMap((m) => ({ ...m, [val]: label }));
    setItemsOrder((order) => {
      if (order.includes(val)) return order;
      return [...order, val];
    });
  }, []);

  const unregisterItem = useCallback((val: string) => {
    setItemsMap((m) => {
      const copy = { ...m };
      delete copy[val];
      return copy;
    });
    setItemsOrder((order) => order.filter((v) => v !== val));
  }, []);

  useEffect(() => {
    // keep highlight on current selection when opening
    if (open) {
      const idx = itemsOrder.indexOf(value);
      if (idx >= 0) setHighlightIndex(idx);
      else setHighlightIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, value, itemsOrder.join(",")]);

  const ctx: SelectContextType = {
    value,
    onValueChange,
    registerItem,
    unregisterItem,
    open,
    setOpen,
    highlightIndex,
    setHighlightIndex,
    itemsOrder,
    setItemsOrder,
    itemsMap,
  };

  return <SelectContext.Provider value={ctx}>{children}</SelectContext.Provider>;
}

export const SelectTrigger = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error("SelectTrigger must be used within Select");

  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // close on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!buttonRef.current) return;
      if (buttonRef.current.contains(target)) return;
      // if dropdown is open somewhere else, don't close here (handled by SelectContent)
      ctx.setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [ctx]);

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-haspopup="listbox"
      aria-expanded={ctx.open}
      onClick={() => ctx.setOpen((s) => !s)}
      className={className}
    >
      {children}
    </button>
  );
};

export const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error("SelectValue must be used within Select");
  // Try to resolve a friendly label from the registered items map; fall back to placeholder when not available
  const label = ctx.itemsMap?.[ctx.value] ?? "";

  // Because itemsMap is internal to Select (not exposed on context), we try to show the value itself if no label mapping exists.
  // Consumers often set the value to an index or number; in examples they display label via SelectTrigger children.
  // To keep parity, show placeholder if no label available.
  if (!label) {
    return <span>{placeholder ?? ""}</span>;
  }
  return <span>{label}</span>;
};

// SelectContent: renders the dropdown. Positioning is basic (absolute, top-full of parent)
// For correct placement, wrap SelectTrigger and SelectContent inside a relatively positioned container.
export const SelectContent = ({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const ctx = useContext(SelectContext);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // close on outside click
    const onDoc = (e: MouseEvent) => {
      if (!ctx) return;
      if (!ctx.open) return;
      const target = e.target as Node;
      if (!rootRef.current) return;
      if (rootRef.current.contains(target)) return;
      ctx.setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [ctx]);

  useEffect(() => {
    // keyboard navigation when open
    const onKey = (e: KeyboardEvent) => {
      if (!ctx) return;
      if (!ctx.open) return;
      const len = ctx.itemsOrder.length;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        ctx.setHighlightIndex((i) => Math.min(i + 1, len - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        ctx.setHighlightIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const val = ctx.itemsOrder[ctx.highlightIndex];
        if (val !== undefined) {
          ctx.onValueChange(val);
          ctx.setOpen(false);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        ctx.setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [ctx]);

  if (!ctx) throw new Error("SelectContent must be used within Select");

  if (!ctx.open) return null;

  return (
    <div
      ref={rootRef}
      role="listbox"
      tabIndex={-1}
      className={`absolute z-50 mt-2 w-full max-h-56 overflow-auto rounded bg-neutral-900 border border-neutral-700 shadow-lg ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

export const SelectItem = ({
  value,
  children,
  className = "",
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const ctx = useContext(SelectContext);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // register label (text) for SelectValue consumer if needed
    // We attempt to capture a textual label from children (string) or DOM text content
    const label =
      typeof children === "string"
        ? children
        : ref.current
        ? ref.current.textContent || value
        : value;
    ctx?.registerItem(value, label);
    return () => {
      ctx?.unregisterItem(value);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, children]);

  const isHighlighted = ctx ? ctx.itemsOrder[ctx.highlightIndex] === value : false;
  const isSelected = ctx ? ctx.value === value : false;

  return (
    <div
      ref={ref}
      role="option"
      aria-selected={isSelected}
      onMouseDown={(e) => {
        // prevent blur
        e.preventDefault();
        ctx?.onValueChange(value);
        ctx?.setOpen(false);
      }}
      onMouseEnter={() => {
        const idx = ctx?.itemsOrder.indexOf(value) ?? -1;
        if (idx >= 0) ctx?.setHighlightIndex(idx);
      }}
      className={`flex items-center justify-between gap-2 px-3 py-2 cursor-pointer text-sm transition-colors ${isHighlighted ? "bg-neutral-800" : "hover:bg-neutral-800"} ${isSelected ? "text-terminal-red font-bold" : "text-white"} ${className}`}
    >
      <div className="flex flex-col">{children}</div>
      {isSelected && <span className="text-terminal-red text-xs">Selected</span>}
    </div>
  );
};
