"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface PillOption {
  value: string;
  label: string;
  colorClass: string;
}

interface PillSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: PillOption[];
  compact?: boolean;
}

export function PillSelect({
  value,
  onChange,
  options,
  compact,
}: PillSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = options.find((o) => o.value === value) || options[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className={
          compact
            ? "flex items-center gap-1 rounded-full bg-white/5 border border-border px-2 py-1"
            : "flex items-center justify-between gap-2 bg-[#0f172a] border border-border w-full rounded-xl px-4 py-2.5 text-sm"
        }
      >
        <span
          className={`${compact ? "text-xs" : "text-sm"} px-2 py-0.5 rounded-full font-medium ${selected.colorClass}`}
        >
          {selected.label}
        </span>
        <ChevronDown
          className={`${compact ? "w-3 h-3" : "w-4 h-4"} text-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[140px] bg-[#0f172a] rounded-xl border border-border py-1 shadow-xl">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full flex items-center px-3 py-1.5 hover:bg-white/5 transition-colors ${
                opt.value === value ? "bg-white/5" : ""
              }`}
            >
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${opt.colorClass}`}
              >
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
