import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import GrocerySellerCard from "./GrocerySellerCard";
import { Button } from "@/components/ui/button";
import { useSelectedUser } from "@/modules/admin/context/SelectedUserContext";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { Loader2, Plus, MapPin, Search } from "lucide-react";
import Select from "react-select";
import { useCheckUserSubscriptionQuery } from '@/redux/api/BannerPaymentApi';


const GrocerySellersPage = () => {
  const { user } = useContext(AuthContext);
  const [sellers, setSellers] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const user_id = user?.user?._id;
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);

  const navigate = useNavigate();
  const { setSelectedUser } = useSelectedUser();

  const token = sessionStorage.getItem("token");
  const API_BASE = import.meta.env.VITE_API_URL;

  const API_SELLERS = `${API_BASE}/grocery-sellers/fetch-all-base-member-details`;
  const API_CITIES = `${API_BASE}/address/grocery-seller-cities`;

  const abortControllerRef = useRef(null);
  // 1. Fetch Cities List (Once on mount)
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await axios.get(API_CITIES, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const raw = res.data.cities || [];
        const cityOptions = [
          { value: null, label: "All Cities" },
          ...raw.map((item) => {
            const val = typeof item === "string" ? item : item.value || item.label;
            return { value: val?.trim(), label: val?.trim() };
          }),
        ];

        const unique = [...new Map(cityOptions.map((o) => [o.value, o])).values()];
        setCities(unique);
      } catch (err) {
        console.error("Failed to load cities:", err);
      }
    };
    fetchCities();
  }, [token]);

  // 2. Core Fetch Function
  const fetchSellers = async (pageNum, cityVal = null, isReset = false) => {
    if (loading) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);

    try {
      let url = `${API_SELLERS}?page=${pageNum}&limit=10`; // Enforcing 10 records per page
      if (cityVal) {
        url += `&city=${encodeURIComponent(cityVal.trim())}`;
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: abortControllerRef.current.signal,
      });

      const newSellers = res.data.sellers || [];
        console.log(newSellers,'new seller');
        
      setSellers((prev) => {
        if (isReset || pageNum === 1) return newSellers;

        // Prevent duplicates by ID
        const existingIds = new Set(prev.map((s) => s._id));
        const filteredNew = newSellers.filter((s) => !existingIds.has(s._id));
        return [...prev, ...filteredNew];
      });

      // Update hasMore based on backend response
      setHasMore(res.data.pagination?.hasMore ?? (newSellers.length === 10));
    } catch (error) {
      if (axios.isCancel(error)) return;
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Initial Load (Page 1)
  useEffect(() => {
    fetchSellers(1, null, true);
  }, []);

  // 4. Handle Load More Click
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchSellers(nextPage, selectedCity?.value, false);
  };

  // 5. Handle City Change
  const handleCityChange = (option) => {
    const newCityValue = option?.value || null;
    setSelectedCity(option);
    setPage(1); // Reset page to 1
    setSellers([]); // Clear current list immediately for UX
    fetchSellers(1, newCityValue, true); // Fetch page 1 for new city
  };

  const handleChatClick = (userId) => {
    if (!userId) return;
    setSelectedUser({ _id: userId });
    navigate("/chat");
  };

  // Premium UI Select Styles
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "white",
      borderColor: state.isFocused ? "#0c1f4d" : "#e2e8f0",
      borderWidth: "1.5px",
      borderRadius: "16px",
      paddingLeft: "40px",
      minHeight: "56px",
      boxShadow: state.isFocused ? "0 10px 15px -3px rgba(12, 31, 77, 0.1)" : "none",
      "&:hover": { borderColor: "#0c1f4d" },
      cursor: "pointer",
      transition: "all 0.2s ease",
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "16px",
      marginTop: "8px",
      padding: "8px",
      backgroundColor: "white",
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
      border: "1px solid #f1f5f9",
      zIndex: 50,
    }),
    option: (base, state) => ({
      ...base,
      padding: "12px 16px",
      margin: "2px 0",
      borderRadius: "12px",
      backgroundColor: state.isSelected ? "#0c1f4d" : state.isFocused ? "#f8fafc" : "transparent",
      color: state.isSelected ? "white" : "#475569",
      cursor: "pointer",
      fontWeight: state.isSelected ? "600" : "500",
      ":active": { transform: "scale(0.98)" },
    }),
    singleValue: (base) => ({ ...base, color: "#0c1f4d", fontWeight: "700" }),
    indicatorSeparator: () => ({ display: "none" }),
    dropdownIndicator: (base, state) => ({
      ...base,
      color: state.isFocused ? "#0c1f4d" : "#94a3b8",
      transform: state.selectProps.menuIsOpen ? "rotate(180deg)" : "rotate(0deg)",
      transition: "transform 0.2s ease",
    }),
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="relative mb-12 flex flex-col items-center text-center">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-[2px] bg-red-600" />
          <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-gray-500">Directory</span>
          <div className="w-8 h-[2px] bg-red-600" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-[#0c1f4d] tracking-tight">
          Base <span className="text-red-600">Members</span>
        </h1>
      </div>

      {/* Filter */}
      <div className="w-full flex justify-center mb-16">
        <div className="w-full max-w-md relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 z-10 text-gray-400 group-focus-within:text-[#0c1f4d]">
            <Search className="w-5 h-5" />
          </div>
          <Select
            options={cities}
            value={selectedCity}
            onChange={handleCityChange}
            placeholder="Search city..."
            isSearchable
            isClearable
            styles={customSelectStyles}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
        {sellers.map((seller) => (
          <GrocerySellerCard key={seller._id} seller={seller} onChatClick={handleChatClick} />
        ))}
      </div>

      {/* Empty State */}
      {!loading && sellers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
          <MapPin className="w-10 h-10 text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-[#0c1f4d]">No sellers found</h3>
          <p className="text-gray-400 text-sm">Try another city or reset the filter.</p>
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="mt-16 mb-12 text-center">
          <Button
            onClick={handleLoadMore}
            disabled={loading}
            className="min-w-[220px] h-14 bg-[#0c1f4d] hover:bg-[#162d66] text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
            {loading ? "Fetching..." : "Load More Sellers"}
          </Button>
        </div>
      )}

      {!hasMore && sellers.length > 0 && (
        <div className="mt-12 text-center">
          <span className="px-6 py-2 bg-gray-100 text-gray-500 text-xs font-bold uppercase tracking-widest rounded-full">
            All records loaded
          </span>
        </div>
      )}
    </div>
  );
};

export default GrocerySellersPage;
