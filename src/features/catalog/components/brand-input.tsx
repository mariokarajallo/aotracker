"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface BrandInputProps {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  brands: string[];
  placeholder?: string;
}

function normalizeBrand(input: string, existingBrands: string[]): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const match = existingBrands.find((b) => b.toLowerCase() === trimmed.toLowerCase());
  if (match) return match;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function BrandInput({ id, value, onChange, brands, placeholder }: BrandInputProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered =
    value.length >= 3
      ? brands.filter((b) => b.toLowerCase().includes(value.toLowerCase()))
      : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
    setOpen(true);
  }

  function handleSelect(brand: string) {
    onChange(brand);
    setOpen(false);
  }

  function handleBlur() {
    if (value.trim()) {
      onChange(normalizeBrand(value, brands));
    }
    setTimeout(() => setOpen(false), 150);
  }

  function handleFocus() {
    if (value.length >= 3 && filtered.length > 0) setOpen(true);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={value}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-md max-h-48 overflow-auto">
          {filtered.map((brand) => (
            <button
              key={brand}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(brand)}
            >
              {brand}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
