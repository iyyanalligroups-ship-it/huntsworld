import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../ProductsPages/Sidebar";
import FilterHeader from "../ProductsPages/FilterHeader";
import ProductCard from "../ProductsPages/ProductCard";
import { LayoutGrid, AlignLeft, Ban, Loader2, ArrowLeft } from "lucide-react";
import { useGetDeepSubProductsByNameQuery } from "@/redux/api/CategoryApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";

const ProductListPage = () => {
  const { deepSubCategory, type } = useParams();

  // 1. FIX: Initialize state with the URL param so it's not empty on first render
  const [selectedCategory, setSelectedCategory] = useState(deepSubCategory || "");
  const navigate = useNavigate();
  const [searchLocation, setSearchLocation] = useState("");
  const [debouncedSearchLocation, setDebouncedSearchLocation] = useState("");
  const [nearMe, setNearMe] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");
  const [viewType, setViewType] = useState("grid");
  const [userLocation, setUserLocation] = useState({ lat: null, lng: null });
  const [merchantType, setMerchantType] = useState("products");

  // Pagination State
  const [page, setPage] = useState(1);
  const [allProducts, setAllProducts] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef();

  // Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchLocation(searchLocation);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchLocation]);

  // Sync State with URL if user navigates back/forward
  useEffect(() => {
    if (deepSubCategory) {
      setSelectedCategory(deepSubCategory);
    }
  }, [deepSubCategory]);

  // Geolocation
  useEffect(() => {
    if (nearMe && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error("Geolocation error:", error)
      );
    }
  }, [nearMe]);

  // 2. Reset Logic:
  // Since selectedCategory is initialized correctly now, this won't fire incorrectly on mount.
  useEffect(() => {
    setPage(1);
    setAllProducts([]);
    setHasMore(true);
  }, [selectedCategory, debouncedSearchLocation, selectedCity, nearMe, merchantType]);

  // 3. API Query
  const {
    data: responseData,
    isLoading,
    isFetching,
    isError,
    error,
  } = useGetDeepSubProductsByNameQuery({
    modelName: type === "super" ? "super-sub-category" : "deep-sub-category",
    sub_category_name: selectedCategory, // Now we can purely rely on state
    page,
    limit: 6,
    city: selectedCity,
    lat: nearMe ? userLocation?.lat : undefined,
    lng: nearMe ? userLocation?.lng : undefined,
    searchLocation: debouncedSearchLocation,
    type: merchantType,
  });

  const deepSubCategories = responseData?.deepSubCategoryList || responseData?.deepSubCategoryDetail || [];
  const totalPages = responseData?.totalPages || 1;

  // 4. Data Merging Logic
  useEffect(() => {
    if (responseData?.data) {
      if (page === 1) {
        setAllProducts(responseData.data);
      } else {
        setAllProducts((prev) => {
          const newIds = new Set(responseData.data.map((p) => p._id));
          const filteredPrev = prev.filter((p) => !newIds.has(p._id));
          return [...filteredPrev, ...responseData.data];
        });
      }
      setHasMore(page < totalPages);
    }
  }, [responseData, page, totalPages]);

  // Infinite Scroll Observer
  const lastElementRef = useCallback(
    (node) => {
      if (isLoading || isFetching) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      }, {
        rootMargin: "200px",
        threshold: 0.1
      });

      if (node) observer.current.observe(node);
    },
    [isLoading, isFetching, hasMore]
  );

  const isNotFoundError =
    isError &&
    error?.data?.success === false &&
    [
      "DeepSubCategory not found",
      "SuperSubCategory not found",
      "No DeepSubCategories found under this SuperSubCategory",
    ].includes(error?.data?.message);

  const cities = allProducts.length > 0
    ? [...new Map(allProducts.map((p) => p.primaryAddress?.city).filter(Boolean).map((c) => [c, { label: c, value: c }])).values()]
    : [{ label: "Navi Mumbai", value: "Navi Mumbai" }, { label: "Pune", value: "Pune" }, { label: "Delhi", value: "Delhi" }];

  const displayCat = selectedCategory ? selectedCategory.replace(/-/g, " ") : "Products";

  return (
    <div className="container mx-auto max-w-7xl p-4 relative">
      <SEO 
        title={`${displayCat} B2B Wholesale Suppliers`}
        description={`Source top ${displayCat} from verified wholesale B2B suppliers, exporters, and manufacturers on Huntsworld.`}
        canonicalUrl={`https://huntsworld.com/products/${type}/${deepSubCategory}`}
      />
      <Button
        type="button"
        onClick={() => navigate(-1)}
        variant="outline"
        className="hidden md:flex absolute cursor-pointer top-20 left-4 z-40 gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>
      <h1 className="text-2xl font-bold mb-20 capitalize">
        <span className="text-[#0c1f4d]">{displayCat}</span> B2B Wholesale Suppliers
        <span className="text-sm font-normal ml-2 text-gray-500">
          ({responseData?.totalCount || 0} Products)
        </span>
      </h1>

      <FilterHeader
        searchLocation={searchLocation}
        onSearchLocationChange={setSearchLocation}
        nearMe={nearMe}
        merchantType={merchantType}
        onTypeChange={setMerchantType}
        onNearMeToggle={() => setNearMe(!nearMe)}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        cities={cities}
      />

      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-64 shrink-0">
          <Sidebar
            categories={deepSubCategories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-end mb-4">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                onClick={() => setViewType("list")}
                className={`px-3 py-1.5 border text-xs md:text-sm flex gap-2 items-center rounded-l-lg cursor-pointer ${viewType === "list" ? "bg-gray-200" : "bg-white hover:bg-gray-50"}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> List
              </button>
              <button
                onClick={() => setViewType("grid")}
                className={`px-3 py-1.5 border-y border-r flex gap-2 items-center rounded-r-lg text-xs md:text-sm cursor-pointer ${viewType === "grid" ? "bg-gray-200" : "bg-white hover:bg-gray-50"}`}
              >
                <AlignLeft className="w-3.5 h-3.5" /> Grid
              </button>
            </div>
          </div>

          {type === "super" && deepSubCategories?.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg md:text-xl font-bold mb-4">Explore by Product</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {deepSubCategories.slice(0, 5).map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedCategory(item.deep_sub_category_name)}
                    className={`cursor-pointer flex flex-col sm:flex-row gap-2 items-center p-2 border rounded-xl shadow-sm hover:shadow-md bg-white ${selectedCategory === item.deep_sub_category_name ? "ring-2 ring-[#e03733]" : ""}`}
                  >
                    <img src={item.deep_sub_category_image} alt={item.deep_sub_category_name} className="h-12 w-12 object-cover rounded-lg" />
                    <div className="text-xs font-semibold line-clamp-1">{item.deep_sub_category_name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoading && page === 1 ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
          ) : isNotFoundError || isError ? (
            <div className="flex justify-center py-10">
              <Card className="max-w-md w-full border-slate-100 shadow-sm">
                <CardContent className="flex flex-col items-center py-10">
                  <Ban className="w-10 h-10 text-red-500 opacity-50 mb-4" />
                  <h2 className="text-lg font-bold">
                    {isError ? "Error Loading Products" : "No Results Found"}
                  </h2>
                  <p className="text-slate-500 text-sm">Try adjusting your filters.</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className={viewType === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4" : "flex flex-col gap-4"}>
              {allProducts.length === 0 ? (
                <div className="text-center py-10 text-slate-400 italic">No products found in {selectedCategory}.</div>
              ) : (
                allProducts.map((product, idx) => {
                  if (allProducts.length === idx + 1) {
                    return (
                      <div ref={lastElementRef} key={product._id || idx}>
                        <ProductCard product={product} viewType={viewType} />
                      </div>
                    );
                  }
                  return <ProductCard key={product._id || idx} product={product} viewType={viewType} />;
                })
              )}
            </div>
          )}

          {isFetching && page > 1 && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}

          {!hasMore && allProducts.length > 0 && (
            <div className="text-center text-xs text-gray-400 py-6">
              You've viewed all {allProducts.length} products
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;
