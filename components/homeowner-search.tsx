"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Users, X } from "lucide-react";
import type { UserProfile } from "@/lib/types";

interface HomeownerSearchProps {
  onSelect: (homeowner: UserProfile | null) => void;
  selectedHomeowner?: UserProfile | null;
  required?: boolean;
  placeholder?: string;
}

export default function HomeownerSearch({
  onSelect,
  selectedHomeowner = null,
  required = false,
  placeholder = "Search by name, email, or address...",
}: HomeownerSearchProps) {
  const [query, setQuery] = useState(selectedHomeowner?.name || "");
  const [results, setResults] = useState<UserProfile[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync display text when selectedHomeowner changes externally
  useEffect(() => {
    setQuery(selectedHomeowner?.name || "");
  }, [selectedHomeowner]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchHomeowners = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/users/homeowners?q=${encodeURIComponent(q)}&limit=20`,
      );
      if (res.ok) {
        setResults(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    setDropdownOpen(true);

    // If selected and text changed, clear selection
    if (selectedHomeowner && value !== selectedHomeowner.name) {
      onSelect(null);
    }

    // Debounced search
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchHomeowners(value), 300);
  }

  function handleSelect(hw: UserProfile) {
    setQuery(hw.name);
    setDropdownOpen(false);
    onSelect(hw);
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    onSelect(null);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            if (!selectedHomeowner && query.trim()) {
              setDropdownOpen(true);
            }
          }}
          placeholder={placeholder}
          className="glass-input w-full rounded-xl pl-10 pr-10 py-2.5 text-sm"
        />
        {selectedHomeowner && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {/* Hidden input for form validation */}
      {required && (
        <input type="hidden" value={selectedHomeowner?.id || ""} required />
      )}

      {dropdownOpen && !selectedHomeowner && (
        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto glass-strong rounded-xl border border-border shadow-xl">
          {loading ? (
            <div className="px-4 py-3 text-sm text-muted">Searching...</div>
          ) : results.length === 0 && query.trim() ? (
            <div className="px-4 py-3 text-sm text-muted">
              No homeowners found
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted">
              Type to search homeowners...
            </div>
          ) : (
            results.map((hw) => (
              <button
                type="button"
                key={hw.id}
                onClick={() => handleSelect(hw)}
                className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent-light shrink-0">
                  {hw.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{hw.name}</p>
                  {hw.email && (
                    <p className="text-xs text-muted truncate">{hw.email}</p>
                  )}
                  {hw.address && (
                    <p className="text-xs text-muted/60 truncate">
                      {hw.address}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
