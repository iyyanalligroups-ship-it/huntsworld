import React, { useState, useEffect, useContext, useRef } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, MapPin, LayoutGrid, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useGetSuggestionsQuery,
  useCreateBuyLeadMutation,
} from "@/redux/api/ProductApi";
import { useGetCompanyTypesQuery } from "@/redux/api/CompanyTypeApi";
import { useGetUniqueCitiesQuery } from "@/redux/api/AddressApi";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const HighlightedText = ({ text, highlight }) => {
  if (!highlight?.trim() || !text) return <span>{text}</span>;
  const regex = new RegExp(`(${escapeRegExp(highlight)})`, "gi");
  return (
    <>
      {text.split(regex).map((part, i) =>
        regex.test(part) ? (
          <strong key={i} className="text-[#0c1f4d] bg-blue-50 px-0.5 rounded font-bold">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

const HeaderSearch = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const suggestionRefs = useRef([]);

  const [selectedCategory, setSelectedCategory] = useState("products");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryItems, setCategoryItems] = useState([]);

  const { data: cities = [] } = useGetUniqueCitiesQuery();
  const { data: companyTypesData } = useGetCompanyTypesQuery({ page: categoryPage, limit: 5 });
  const categoryHasMore = categoryPage < (companyTypesData?.pagination?.pages || 1);

  // Accumulate pages
  useEffect(() => {
    if (companyTypesData?.data?.length > 0) {
      setCategoryItems((prev) => {
        const existingValues = new Set(prev.map((t) => t.name));
        const newItems = companyTypesData.data
          .filter((t) => !existingValues.has(t.name))
          .map((t) => ({ value: t.name, label: t.displayName }));
        return [...prev, ...newItems];
      });
    }
  }, [companyTypesData]);

  const { data: apiResponse, isLoading } = useGetSuggestionsQuery(
    { category: selectedCategory, term: searchTerm, city: selectedCity !== "all" ? selectedCity : "" },
    { skip: searchTerm.trim().length === 0 }
  );

  const [createBuyLead] = useCreateBuyLeadMutation();
  const suggestions = apiResponse?.suggestions ?? [];

  // ✅ NEW: Auto-scroll to the active item when using arrows
  useEffect(() => {
    if (activeIndex !== -1 && suggestionRefs.current[activeIndex]) {
      suggestionRefs.current[activeIndex].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeIndex]);

  // ✅ NEW: Handle Arrow Keys & Enter
  const handleKeyDown = (e) => {
    // If suggestions are hidden or empty, only allow Enter to trigger normal search
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearch();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault(); // Stop cursor from moving in input
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    }
    else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    }
    else if (e.key === "Enter") {
      e.preventDefault(); // Stop form submit universally
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        handleSuggestionClick(suggestions[activeIndex]); // Select the highlighted item
      } else {
        handleSearch(); // Normal search if nothing highlighted
      }
    }
    else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  const handleSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const term = searchTerm.trim() || "all";
    const city = selectedCity !== "all" ? selectedCity : "";

    if (user?.user?._id) {
      try {
        await createBuyLead({
          searchTerm: term,
          type: selectedCategory === "products" ? "product" : selectedCategory,
          user_id: user.user._id,
          city,
          category_id: null,
          sub_category_id: null
        }).unwrap();
      } catch (err) {
        console.error("Buy lead creation error:", err);
      }
    }

    const cityParam = city ? `/${encodeURIComponent(city)}` : "";
    navigate(`/search/${selectedCategory}/${encodeURIComponent(term)}${cityParam}`);
    setShowSuggestions(false);
    setIsMobileModalOpen(false); // Close modal on search
  };

  const handleSuggestionClick = async (sug) => {
    const city = selectedCity !== "all" ? selectedCity : "";
    const cityParam = city ? `/${encodeURIComponent(city)}` : "";
    const path = sug.type === "base_member" ? "base_member" : sug.type === "company" ? selectedCategory : "products";

    if (user?.user?._id) {
      await createBuyLead({
        searchTerm: sug.name,
        type: path === "products" ? "product" : path,
        user_id: user.user._id,
        city,
        category_id: sug.category_id || null,
        sub_category_id: sug.sub_category_id || null
      }).catch(console.error);
    }

    navigate(`/search/${path}/${encodeURIComponent(sug.name)}${cityParam}`);
    setShowSuggestions(false);
    setIsMobileModalOpen(false);
    setActiveIndex(-1);
  };

  /* Logic for rendering suggestions shared by both mobile and desktop */
  const renderSuggestions = () => (
    <div className="overflow-y-auto max-h-[350px] py-2">
      {isLoading && <div className="p-4 text-sm text-slate-400">Searching...</div>}
      {!isLoading && suggestions.map((sug, index) => (
        <div
          key={sug.id}
          ref={(el) => (suggestionRefs.current[index] = el)}
          onClick={() => handleSuggestionClick(sug)}
          onMouseEnter={() => setActiveIndex(index)}
          className={`px-5 py-3 cursor-pointer border-b border-slate-50 last:border-0 transition-colors ${activeIndex === index ? "bg-blue-50/70" : "hover:bg-slate-50"
            }`}
        >
          <div className={`text-[14px] font-semibold ${activeIndex === index ? "text-[#0c1f4d]" : "text-slate-700"}`}>
            <HighlightedText text={sug.name} highlight={searchTerm} />
          </div>
          {sug.description && <div className="text-[11px] text-slate-400 line-clamp-1">{sug.description}</div>}
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto z-50">


      <div className="lg:hidden w-full px-2">
        <Dialog open={isMobileModalOpen} onOpenChange={setIsMobileModalOpen}>
          <DialogTrigger asChild>
            <div className="flex items-center bg-white border border-slate-200 rounded-full h-[50px] px-4 gap-3 shadow-sm cursor-pointer">
              <SearchIcon size={18} className="text-slate-400" />
              <span className="text-slate-400 text-sm font-medium">Search products in {selectedCity === 'all' ? 'All Cities' : selectedCity}...</span>
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-full h-full sm:h-auto top-0 sm:top-[50%] translate-y-0 sm:translate-y-[-50%] p-0 gap-0 overflow-hidden flex flex-col">
            <DialogHeader className="p-4 border-b shrink-0">
              <DialogTitle className="text-left text-lg font-bold text-[#0c1f4d]">Search HuntsWorld</DialogTitle>
            </DialogHeader>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Mobile Category Select */}
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-slate-400">Search In</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full h-12 bg-slate-50 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="products">Products</SelectItem>
                    {categoryItems.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                    {categoryHasMore && (
                      <div
                        className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm font-bold text-blue-600 outline-none hover:bg-slate-100 transition-colors"
                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCategoryPage((prev) => prev + 1);
                        }}
                      >
                        + Load More
                      </div>
                    )}
                    <SelectItem value="base_member">Base Members</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Mobile City Select */}
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-slate-400">Location</label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="w-full h-12 bg-slate-50 border-slate-200">
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map((c) => <SelectItem key={c.city} value={c.city}>{c.city}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Mobile Search Input */}
              <div className="space-y-1.5 relative">
                <label className="text-[11px] uppercase font-bold text-slate-400">Product Name</label>
                <Input
                  value={searchTerm}
                  placeholder="What are you looking for?"
                  className="h-12 pr-10 border-slate-200"

                  /* ✅ UPDATE THIS PART */
                  onKeyDown={handleKeyDown}

                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                    setActiveIndex(-1);
                  }}
                />

                {/* Mobile Suggestions Display */}
                {searchTerm && suggestions.length > 0 && (
                  <div className="mt-2 border rounded-xl bg-white shadow-inner overflow-hidden">
                    {renderSuggestions()}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t mt-auto shrink-0 bg-slate-50">
              <Button onClick={handleSearch} className="w-full h-12 bg-[#0c1f4d] font-bold text-lg rounded-xl">
                Search Now
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ==========================================
          DESKTOP VIEW (Visible > 1024px)
          ========================================== */}
      <div className="hidden lg:flex items-center bg-white border border-slate-200 rounded-full h-[64px] shadow-sm group">
        {/* SECTION 1: Category */}
        <div className="flex-[0.8] h-full flex items-center">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full h-full border-none shadow-none rounded-l-full px-5 hover:bg-slate-50/50 transition-colors focus:ring-0 flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-lg shrink-0">
                <LayoutGrid size={20} className="text-[#0c1f4d]" />
              </div>
              <div className="flex flex-col items-start text-left leading-none">
                <span className="text-[10px] uppercase font-bold text-[#0c1f4d] tracking-tight mb-1">Search In</span>
                <div className="text-[15px] font-bold text-slate-700 truncate w-24">
                  <SelectValue />
                </div>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="products">Products</SelectItem>
              {categoryItems.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
              {categoryHasMore && (
                <div
                  className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm font-bold text-blue-600 outline-none hover:bg-slate-100 transition-colors"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCategoryPage((prev) => prev + 1);
                  }}
                >
                  + Load More
                </div>
              )}
              <SelectItem value="base_member">Base Members</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="h-8 w-[1px] bg-slate-200 shrink-0" />

        {/* SECTION 2: Location */}
        <div className="flex-[0.7] h-full flex items-center">
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="w-full h-full border-none shadow-none px-5 hover:bg-slate-50/50 transition-colors focus:ring-0 flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-rose-50 rounded-lg shrink-0">
                <MapPin size={20} className="text-rose-500" />
              </div>
              <div className="flex flex-col items-start text-left leading-none">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tight mb-1">Where?</span>
                <div className="text-[15px] font-bold text-slate-700 truncate w-24">
                  <SelectValue placeholder="All Cities" />
                </div>
              </div>
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map((c) => <SelectItem key={c.city} value={c.city}>{c.city}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="h-8 w-[1px] bg-slate-200 shrink-0" />

        {/* SECTION 3: Search Input */}

        <div className="flex-1 h-full flex items-center px-4 relative">
          <Input
            value={searchTerm}
            placeholder="Search products..."
            className="border-none shadow-none focus-visible:ring-0 h-full text-[15px] font-medium text-slate-700 bg-transparent"

            /* ✅ UPDATE THIS PART */
            onKeyDown={handleKeyDown}

            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
              setActiveIndex(-1); // Reset selection on typing
            }}
            onFocus={() => setShowSuggestions(true)}
          />
        </div>

        {/* SECTION 4: Button */}
        <div className="pr-2 flex items-center shrink-0">
          <Button
            onClick={handleSearch}
            className="rounded-full h-[48px] px-8 bg-[#0c1f4d] hover:bg-[#0c204df3] shadow-md flex items-center gap-2"
          >
            <SearchIcon size={18} strokeWidth={2.5} />
            <span className="font-bold">Search</span>
          </Button>
        </div>

        {/* Desktop Suggestions Overlay */}
        {showSuggestions && searchTerm && (
          <div className="absolute top-[calc(100%+8px)] left-4 right-4 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-[350px] overflow-hidden z-[60]">
            {renderSuggestions()}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeaderSearch;
