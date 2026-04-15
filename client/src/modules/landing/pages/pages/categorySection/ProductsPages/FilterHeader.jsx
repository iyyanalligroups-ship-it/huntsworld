import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Store } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useGetCompanyTypesQuery } from "@/redux/api/CompanyTypeApi";

const FilterHeader = ({
  searchLocation,
  onSearchLocationChange,
  nearMe,
  onNearMeToggle,
  selectedCity,
  onCityChange,
  cities = [],
  // New Props
  merchantType,
  onTypeChange,
}) => {
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryItems, setCategoryItems] = useState([]);

  const { data: companyTypesData } = useGetCompanyTypesQuery({ page: categoryPage, limit: 5 });
  const categoryHasMore = categoryPage < (companyTypesData?.pagination?.pages || 1);

  // Accumulate loaded pages
  React.useEffect(() => {
    if (companyTypesData?.data?.length > 0) {
      setCategoryItems((prev) => {
        const existingValues = new Set(prev.map((t) => t.value));
        const newItems = companyTypesData.data
          .filter((t) => !existingValues.has(t.name))
          .map((t) => ({ value: t.name, label: t.displayName }));
        return [...prev, ...newItems];
      });
    }
  }, [companyTypesData]);

  const merchantOptions = [
    { label: "All Products", value: "products" },
    ...categoryItems,
  ];

  return (
    <div className="flex flex-wrap items-center gap-6 mb-6 bg-white p-5 rounded-xl border border-slate-100 shadow-sm">

      {/* 1. 🔍 Search by Area/Location */}
      <div className="flex flex-col gap-1.5 min-w-[200px]">
        <Label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Area / Locality</Label>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <Input
            placeholder="Search locality..."
            value={searchLocation}
            onChange={(e) => onSearchLocationChange(e.target.value)}
            className="pl-9 h-11 border-slate-200 focus:ring-indigo-500 rounded-lg"
          />
        </div>
      </div>

      {/* 2. 🏙️ City Filter */}
      <div className="flex flex-col gap-1.5 min-w-[160px]">
        <Label className="text-[10px] uppercase font-bold text-slate-400 ml-1">City</Label>
        <Select value={selectedCity} onValueChange={onCityChange}>
          <SelectTrigger className="h-11 border-slate-200 rounded-lg">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              <SelectValue placeholder="Select City" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {cities.map((city, idx) => (
              <SelectItem key={idx} value={city.value}>
                {city.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 3. 🏭 Merchant Type Filter */}
    {/* Business Type Filter */}
      <div className="flex flex-col gap-1.5 min-w-[180px]">
        <Label className="text-[10px] uppercase font-bold text-slate-400">Business Type</Label>
        <Select value={merchantType} onValueChange={onTypeChange}>
          <SelectTrigger className="h-11 border-slate-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-indigo-500" />
              <SelectValue placeholder="Select Type" />
            </div>
          </SelectTrigger>
          <SelectContent>
           {merchantOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
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
          </SelectContent>
        </Select>
      </div>

      {/* 4. 📍 Near Me Toggle */}
      {/* <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 self-end h-11">
        <Checkbox
          id="nearMe"
          checked={nearMe}
          onCheckedChange={onNearMeToggle}
          className="data-[state=checked]:bg-indigo-600 border-slate-300"
        />
        <Label htmlFor="nearMe" className="text-sm font-bold text-slate-700 cursor-pointer flex items-center gap-1.5">
          <MapPin size={14} className="text-indigo-500" />
          Near Me
        </Label>
      </div> */}
    </div>
  );
};

export default FilterHeader;
