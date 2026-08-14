import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export const SearchableSelect = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  disabled = false,
  className = '',
  badge = null,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const selectedOption = options.find(
    (opt) => String(opt.value) === String(value) || String(opt.id) === String(value)
  );

  const filteredOptions = options.filter((opt) => {
    const label = opt.label || opt.name || opt.title || '';
    const code = opt.code || '';
    const category = opt.category || opt.departmentName || '';
    const query = searchTerm.toLowerCase();
    return (
      label.toLowerCase().includes(query) ||
      code.toLowerCase().includes(query) ||
      category.toLowerCase().includes(query)
    );
  });

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl border transition-all duration-200 ${
          disabled
            ? 'bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            : isOpen
            ? 'bg-white dark:bg-slate-900 border-blue-500 dark:border-cyan-500 ring-2 ring-blue-500/20 dark:ring-cyan-500/20 text-slate-900 dark:text-white shadow-sm cursor-pointer'
            : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900 shadow-sm cursor-pointer'
        }`}
      >
        <span className="truncate text-left flex items-center gap-2">
          {selectedOption ? (
            <>
              {selectedOption.departmentName && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-cyan-950/80 text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-cyan-800/60 font-medium">
                  {selectedOption.departmentName}
                </span>
              )}
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {selectedOption.label || selectedOption.name}
              </span>
              {selectedOption.code && (
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  ({selectedOption.code})
                </span>
              )}
            </>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">{placeholder}</span>
          )}
        </span>

        <div className="flex items-center gap-1.5 ml-2">
          {value && !disabled && (
            <span
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-600 dark:text-cyan-400' : ''
            }`}
          />
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/90 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Search Box Header */}
          <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-cyan-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const optVal = opt.value !== undefined ? opt.value : opt.id;
                const isSelected = String(optVal) === String(value);
                const optLabel = opt.label || opt.name;

                return (
                  <button
                    key={optVal}
                    type="button"
                    onClick={() => handleSelect(optVal)}
                    className={`w-full flex items-center justify-between px-3 py-2 my-0.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-cyan-950/60 text-blue-700 dark:text-cyan-300 font-semibold border border-blue-200 dark:border-cyan-800/40'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex flex-col gap-0.5 truncate pr-2">
                      <div className="flex items-center gap-2">
                        <span>{optLabel}</span>
                        {opt.code && (
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                            [{opt.code}]
                          </span>
                        )}
                      </div>
                      {(opt.departmentName || opt.category || opt.fees) && (
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                          {opt.departmentName && (
                            <span className="text-blue-600 dark:text-cyan-400 font-medium">
                              {opt.departmentName}
                            </span>
                          )}
                          {opt.fees !== undefined && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                              ₹{Number(opt.fees).toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500">
                No matching options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
