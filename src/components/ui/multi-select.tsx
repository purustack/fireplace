"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/input";

type Option = string;

type MultiSelectProps = {
  name: string;
  label: string;
  options: readonly Option[] | Option[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  required?: boolean;
  max?: number;
  allowCustom?: boolean;
  hint?: string;
};

export function MultiSelect({
  name,
  label,
  options,
  value,
  onChange,
  placeholder = "Select…",
  required,
  max = 15,
  allowCustom = true,
  hint,
}: MultiSelectProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [custom, setCustom] = useState("");

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...options];
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  function toggle(option: string) {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
      return;
    }
    if (value.length >= max) return;
    onChange([...value, option]);
  }

  function addCustom() {
    const next = custom.trim();
    if (!next) return;
    if (value.some((v) => v.toLowerCase() === next.toLowerCase())) {
      setCustom("");
      return;
    }
    if (value.length >= max) return;
    onChange([...value, next]);
    setCustom("");
  }

  return (
    <div ref={rootRef} className="relative">
      <Label htmlFor={id}>{label}</Label>
      <input
        type="hidden"
        name={name}
        value={value.join(",")}
        required={required && value.length === 0}
      />

      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-smoke/40 bg-warm-white px-3.5 py-2 text-left text-sm shadow-sm transition",
          "focus-visible:border-ember focus-visible:ring-2 focus-visible:ring-ember/20",
          open && "border-ember ring-2 ring-ember/20",
        )}
      >
        <span className={cn("flex flex-1 flex-wrap gap-1.5", !value.length && "text-smoke")}>
          {value.length === 0
            ? placeholder
            : value.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 rounded-lg bg-ember-soft px-2 py-0.5 text-xs font-semibold text-ember-deep"
                >
                  {item}
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Remove ${item}`}
                    className="rounded hover:bg-ember/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(value.filter((v) => v !== item));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        onChange(value.filter((v) => v !== item));
                      }
                    }}
                  >
                    <X className="h-3 w-3" />
                  </span>
                </span>
              ))}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-ash transition", open && "rotate-180")} />
      </button>

      {hint ? <p className="mt-1.5 text-xs text-ash">{hint}</p> : null}

      {open ? (
        <div
          role="listbox"
          aria-multiselectable
          className="absolute z-30 mt-2 max-h-72 w-full overflow-hidden rounded-xl border border-smoke/40 bg-warm-white shadow-lg shadow-coal/10"
        >
          <div className="border-b border-smoke/30 p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="h-9 w-full rounded-lg border border-smoke/30 bg-parchment px-3 text-sm outline-none focus:border-ember"
            />
          </div>
          <ul className="max-h-44 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-ash">No matches</li>
            ) : (
              filtered.map((option) => {
                const selected = value.includes(option);
                const disabled = !selected && value.length >= max;
                return (
                  <li key={option}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      disabled={disabled}
                      onClick={() => toggle(option)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm",
                        selected ? "bg-ember-soft text-ember-deep" : "hover:bg-parchment",
                        disabled && "opacity-40",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded border",
                          selected
                            ? "border-ember bg-ember text-warm-white"
                            : "border-smoke/50",
                        )}
                      >
                        {selected ? <Check className="h-3 w-3" /> : null}
                      </span>
                      {option}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          {allowCustom ? (
            <div className="flex gap-2 border-t border-smoke/30 p-2">
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustom();
                  }
                }}
                placeholder="Add custom…"
                className="h-9 flex-1 rounded-lg border border-smoke/30 bg-parchment px-3 text-sm outline-none focus:border-ember"
              />
              <button
                type="button"
                onClick={addCustom}
                className="inline-flex h-9 items-center gap-1 rounded-lg bg-ember px-3 text-sm font-semibold text-warm-white"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

type SearchableSelectProps = {
  name: string;
  label: string;
  options: readonly Option[] | Option[];
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  required?: boolean;
  allowCustom?: boolean;
};

export function SearchableSelect({
  name,
  label,
  options,
  value,
  onChange,
  placeholder = "Select…",
  required,
  allowCustom = true,
}: SearchableSelectProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...options];
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div ref={rootRef} className="relative">
      <Label htmlFor={id}>{label}</Label>
      <input type="hidden" name={name} value={value} required={required && !value} />
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-smoke/40 bg-warm-white px-3.5 text-left text-sm shadow-sm transition",
          "focus-visible:border-ember focus-visible:ring-2 focus-visible:ring-ember/20",
          open && "border-ember ring-2 ring-ember/20",
          !value && "text-smoke",
        )}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-ash transition", open && "rotate-180")} />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute z-30 mt-2 max-h-72 w-full overflow-hidden rounded-xl border border-smoke/40 bg-warm-white shadow-lg shadow-coal/10"
        >
          <div className="border-b border-smoke/30 p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && allowCustom && query.trim()) {
                  e.preventDefault();
                  onChange(query.trim());
                  setOpen(false);
                  setQuery("");
                }
              }}
              placeholder={allowCustom ? "Search or type custom…" : "Search…"}
              className="h-9 w-full rounded-lg border border-smoke/30 bg-parchment px-3 text-sm outline-none focus:border-ember"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto p-1">
            {allowCustom && query.trim() && !options.some((o) => o.toLowerCase() === query.trim().toLowerCase()) ? (
              <li>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ember hover:bg-ember-soft"
                  onClick={() => {
                    onChange(query.trim());
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Use “{query.trim()}”
                </button>
              </li>
            ) : null}
            {filtered.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === option}
                  onClick={() => {
                    if (option === "Other") {
                      setQuery("");
                      return;
                    }
                    onChange(option);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm",
                    value === option ? "bg-ember-soft text-ember-deep" : "hover:bg-parchment",
                  )}
                >
                  {option === "Other" ? "Other (type custom above)" : option}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
