import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Ban, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "../ProductsPages/ProductCard";
import CompanyCard from "./CompanyCard";
import BaseMemberCard from "./BaseMemberCard";

import {
  useSearchProductsQuery,
  useSearchCompaniesQuery,
} from "@/redux/api/ProductApi";

const SearchResultsPage = () => {
  const { category, searchTerm: rawSearchTerm, city: rawCity } = useParams();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [allResults, setAllResults] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [viewType] = useState("grid");

  const observer = useRef(null);
  const loaderRef = useRef(null);

  const safeDecode = (value) => {
    try {
      return value ? decodeURIComponent(value) : "";
    } catch (e) {
      console.warn("URI decoding failed for:", value);
      return value || "";
    }
  };

  const searchTerm =
    rawSearchTerm && rawSearchTerm !== "all"
      ? safeDecode(rawSearchTerm)
      : "";

  const city = rawCity ? safeDecode(rawCity) : "";

  const isProductCategory = category === "products";
  const isBaseMemberCategory = category === "base_member";
  const isCompanyCategory = !isProductCategory && !isBaseMemberCategory;

  useEffect(() => {
    setPage(1);
    setAllResults([]);
    setHasMore(true);
  }, [category, searchTerm, city]);

  const {
    data: productsData,
    isLoading: productsLoading,
    isFetching: productsFetching,
    isError: productsError,
    error: productsErrorDetails,
  } = useSearchProductsQuery(
    {
      term: searchTerm,
      page,
      city,
      type: category,
    },
    { skip: !isProductCategory }
  );

  const {
    data: companiesData,
    isLoading: companiesLoading,
    isFetching: companiesFetching,
    isError: companiesError,
    error: companiesErrorDetails,
  } = useSearchCompaniesQuery(
    {
      type: category,
      term: searchTerm,
      page,
      city,
    },
    { skip: isProductCategory }
  );

  const activeData = isProductCategory ? productsData : companiesData;
  const isLoading = isProductCategory ? productsLoading : companiesLoading;
  const isFetching = isProductCategory ? productsFetching : companiesFetching;
  const isError = isProductCategory ? productsError : companiesError;
  const errorDetails = isProductCategory ? productsErrorDetails : companiesErrorDetails;

  useEffect(() => {
    if (!activeData?.data) return;
    console.log(activeData.data ,'activeData.data');
    setAllResults((prev) => {
      const existingIds = new Set(prev.map((item) => item._id));
      const newItems = activeData.data.filter((item) => !existingIds.has(item._id));
      return [...prev, ...newItems];
    });

    setHasMore(page < (activeData.totalPages || 1));
  }, [activeData, page]);

  const lastElementRef = useCallback(
    (node) => {
      if (isLoading || isFetching) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isFetching) {
            setPage((prev) => prev + 1);
          }
        },
        { threshold: 0.1 }
      );

      if (node) observer.current.observe(node);
    },
    [hasMore, isFetching, isLoading]
  );

  const handleBack = () => navigate(-1);

  const displayCategory = category
    ? category
        .replace("_", " ")
        .replace(/\b\w/g, (l) => l.toUpperCase())
    : "";

  if (!category) {
    return (
      <div className="container mx-auto max-w-7xl p-6 text-center">
        <p className="text-red-500 mb-4">Missing search parameters</p>
        <Button onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="text-center py-16">
          <Ban className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 font-semibold">
            Failed to load search results
          </p>
          <p className="text-gray-500 text-sm">
            {errorDetails?.data?.message || errorDetails?.message || "Please try again"}
          </p>
        </div>
      </div>
    );
  }

  const totalCount = activeData?.totalCount || allResults.length || 0;
  const isInitialLoading = isLoading && page === 1;

  return (
    <div className="container mx-auto max-w-7xl p-4">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <span className="text-sm text-gray-600">
          Searching for:{" "}
          <strong>"{searchTerm || "all"}"</strong>
          {city && ` in ${city}`}
        </span>
      </div>

      <h1 className="text-2xl font-bold mb-4">
        {displayCategory} Results ({totalCount})
      </h1>

      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-600">
          Found {totalCount}{" "}
          {isProductCategory
            ? "products"
            : isBaseMemberCategory
              ? "members"
              : "companies"}
        </div>
      </div>

      <div
        className={
          viewType === "grid"
            ? isProductCategory
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
        }
      >
        {allResults.map((item, idx) => {
          const isLastElement = idx === allResults.length - 1;

          return (
            <div
              key={item._id || `result-${idx}`}
              ref={isLastElement ? lastElementRef : null}
            >
              {isProductCategory ? (
                <ProductCard
                  product={item}
                  viewType={viewType}
                  searchTerm={searchTerm}
                />
              ) : isBaseMemberCategory ? (
                <BaseMemberCard member={item} viewType={viewType} />
              ) : (
                <CompanyCard
                  company={item}
                  viewType={viewType}
                  searchTerm={searchTerm}
                />
              )}
            </div>
          );
        })}

        {(isFetching || isInitialLoading) && (
          <div
            className={
              viewType === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 col-span-full"
                : "space-y-4"
            }
          >
            {Array.from({ length: isInitialLoading ? 8 : 4 }).map((_, i) => (
              <Skeleton
                key={`loading-${i}`}
                className={
                  viewType === "grid" ? "h-72 rounded-xl" : "h-32 rounded-xl"
                }
              />
            ))}
          </div>
        )}
      </div>

      {!isInitialLoading && allResults.length === 0 && !isFetching && (
        <div className="flex justify-center py-20">
          <Card className="max-w-md w-full border-dashed">
            <CardContent className="text-center py-12">
              <Ban className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No results found</h2>
              <Button variant="link" onClick={handleBack}>
                Try another search
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {!hasMore && allResults.length > 0 && !isFetching && !isInitialLoading && (
        <div className="text-center py-10 text-gray-500 text-sm">
          — You've reached the end —
        </div>
      )}
    </div>
  );
};

export default SearchResultsPage;
