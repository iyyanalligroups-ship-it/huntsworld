// components/ProductNameAutocomplete.jsx
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export default function ProductNameAutocomplete({ value, onChange }) {
  const [search, setSearch] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  // ------------------------------------------------------------------
  // 1. Debounced fetch – runs when user types ≥ 3 chars
  // ------------------------------------------------------------------
  useEffect(() => {
    // Sync internal search with external value (edit mode)
    if (value !== search) setSearch(value || "");

    if (!search || search.trim().length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/products/suggest?q=${encodeURIComponent(
            search.trim()
          )}`
        );
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setShowDropdown(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [search, value]);

  // ------------------------------------------------------------------
  // 2. Handlers
  // ------------------------------------------------------------------
  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    // keep parent form in sync
    onChange({ target: { name: "product_name", value: val, product: null } });
  };

  const handleSelect = (item) => {
    setSearch(item.name);
    onChange({ target: { name: "product_name", value: item.name, product: item } });
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleBlur = (e) => {
    // close dropdown a tick later so click on item works
    setTimeout(() => setShowDropdown(false), 150);
  };

  // ------------------------------------------------------------------
  // 3. Render
  // ------------------------------------------------------------------
  return (
    <div className="relative w-full">
      {/* ----- Text Input ----- */}
      <input
        ref={inputRef}
        type="text"
        placeholder="Type product name..."
        value={search}
        onChange={handleInputChange}
        onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
        onBlur={handleBlur}
        className={cn(
          "flex h-10 w-full rounded-md border-2 border-slate-300 bg-background px-3 py-2 text-sm",
          "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        )}
      />

      {/* ----- Dropdown (real-time suggestions) ----- */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-popover shadow-md">
          <ul className="py-1 text-sm">
            {loading ? (
              <li className="flex items-center gap-2 px-3 py-2 text-muted-foreground">
                <div className="h-3 w-3 animate-spin rounded-full border border-gray-300 border-t-transparent" />
                Loading...
              </li>
            ) : suggestions.length === 0 ? (
              <li className="px-3 py-2 text-muted-foreground">No results found.</li>
            ) : (
              suggestions.map((s, idx) => (
                <li
                  key={idx}
                  onMouseDown={(e) => e.preventDefault()} // prevent input blur
                  onClick={() => handleSelect(s)}
                  className={cn(
                    "cursor-pointer px-3 py-2 hover:bg-accent hover:text-accent-foreground",
                    search === s.name && "bg-accent text-accent-foreground"
                  )}
                >
                  {s.name}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}