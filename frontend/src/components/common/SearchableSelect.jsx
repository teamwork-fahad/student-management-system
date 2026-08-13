import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";

/**
 * Premium Searchable Select Component
 * Replaces plain HTML select dropdowns with a searchable filter popover.
 */
export const SearchableSelect = ({
  options = [],
  value = "",
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Type to search...",
  className = "",
  disabled = false,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);

  // Normalize options array: handles both [{id, name}, ...] and [{value, label}, ...]
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "string") {
      return { value: opt, label: opt };
    }
    return {
      value: opt.value ?? opt.id ?? "",
      label: opt.label ?? opt.name ?? opt.fullName ?? opt.inquiryNumber ?? opt.code ?? "",
      subLabel: opt.subLabel ?? opt.mobile ?? opt.fees ? `₹${opt.fees}` : "",
      raw: opt,
    };
  });

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));

  // Filter options based on search term
  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchLabel = opt.label.toLowerCase().includes(term);
    const matchSub = opt.subLabel ? String(opt.subLabel).toLowerCase().includes(term) : false;
    const matchVal = String(opt.value).toLowerCase().includes(term);
    return matchLabel || matchSub || matchVal;
  });

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    onChange({ target: { name: "", value: val } }, val);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange({ target: { name: "", value: "" } }, "");
    setSearchTerm("");
  };

  return (
    <div ref={containerRef} className={`relative font-sans text-xs w-full ${className}`}>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-left flex items-center justify-between transition-colors focus:outline-none focus:border-blue-500 dark:focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${
          isOpen ? "border-blue-500 dark:border-cyan-500 ring-1 ring-blue-500/20 dark:ring-cyan-500/50" : ""
        }`}
      >
        <span className={`truncate font-medium ${selectedOption ? "text-slate-900 dark:text-slate-100 font-bold" : "text-slate-400 dark:text-slate-500"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center space-x-1 shrink-0 ml-2">
          {value && !required && (
            <span
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform ${isOpen ? "rotate-180 text-blue-600 dark:text-cyan-400" : ""}`} />
        </div>
      </button>

      {/* SEARCHABLE DROPDOWN POPOVER */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-cyan-800/80 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-64 flex flex-col animate-in fade-in zoom-in-95 duration-100">
          {/* SEARCH INPUT BAR */}
          <div className="p-2 bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-blue-500 dark:focus:border-cyan-500 font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-[10px]"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* OPTIONS LIST */}
          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40 max-h-48">
            {!required && (
              <div
                onClick={() => handleSelect("")}
                className={`px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer flex items-center justify-between text-slate-500 dark:text-slate-400 transition ${
                  !value ? "bg-blue-50/70 dark:bg-cyan-950/40 text-blue-700 dark:text-cyan-300 font-bold" : ""
                }`}
              >
                <span>-- None / Default --</span>
                {!value && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />}
              </div>
            )}

            {filteredOptions.length === 0 ? (
              <div className="px-4 py-6 text-center text-slate-400 dark:text-slate-500 italic text-xs">
                No matching options found for "{searchTerm}"
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer flex items-center justify-between transition ${
                      isSelected ? "bg-blue-50 dark:bg-cyan-950/60 text-blue-700 dark:text-cyan-300 font-bold border-l-2 border-blue-600 dark:border-cyan-400" : "text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="block truncate font-semibold">{opt.label}</span>
                      {opt.subLabel && (
                        <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">{opt.subLabel}</span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
