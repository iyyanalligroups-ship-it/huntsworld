import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useGetCategoryByNameQuery } from "@/redux/api/CategoryApi";
import no_image from "@/assets/images/no-image.jpg";
import SEO from "@/components/SEO";

const SubCategoryList = () => {
  const { category, country } = useParams();
  const decodedCategory = decodeURIComponent(category || "");
  console.log("Decoded Category:", decodedCategory, "Country:", country);

  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSubcategories, setExpandedSubcategories] = useState({});

  const { data: responseData, isLoading, isError, refetch } =
    useGetCategoryByNameQuery({
      category_name: decodedCategory,
      page: currentPage,
      ...(country && { country }),
    });

  // Debug: Log response data
  useEffect(() => {
    console.log("responseData:", JSON.stringify(responseData, null, 2));
  }, [responseData]);

  // Refetch when parameters change
  useEffect(() => {
    refetch();
  }, [category, country, currentPage, refetch]);

  const selectedCategory = responseData?.data?.[0];
  const pagination = responseData?.pagination;

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
        <span className="ml-2 text-gray-700">Loading...</span>
      </div>
    );
  }

  if (isError || !selectedCategory) {
    return (
      <div className="p-6 flex flex-col items-center justify-center">
        <img src={no_image} alt="Not Found" className="w-24 h-24 mb-4" />
        <p className="text-gray-600 text-lg font-semibold">No Category Found</p>
      </div>
    );
  }

  const subcategories = selectedCategory?.subcategories || [];

  // Pagination handlers
  const handlePrevPage = () => {
    if (pagination?.currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination?.currentPage < pagination?.totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePageClick = (pageNum) => {
    if (pageNum !== currentPage) setCurrentPage(pageNum);
  };

  // Toggle expanded state for a subcategory
  const toggleExpand = (subcategoryName) => {
    setExpandedSubcategories((prev) => ({
      ...prev,
      [subcategoryName]: !prev[subcategoryName],
    }));
  };

  return (
    <div className="p-4">
      {selectedCategory && (
        <SEO 
          title={`${selectedCategory.categoryName?.replace(/-/g, " ")} Wholesale Suppliers`}
          description={`Find verified B2B wholesale suppliers, manufacturers, and exporters for ${selectedCategory.categoryName?.replace(/-/g, " ")} on Huntsworld.`}
          canonicalUrl={`https://huntsworld.com/all-categories/${category}`}
        />
      )}

      {/* Category Header */}
      <h1 className="w-fit font-bold mb-4 border-l-4 border-[#0c1f4d] text-[#0c1f4d] capitalize bg-gray-50 px-4 py-2 shadow-sm text-2xl">
        {selectedCategory?.categoryName?.replace(/-/g, " ") || "Category"} B2B Wholesale Suppliers
      </h1>

      {/* Subcategory Cards */}
      <TooltipProvider>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {subcategories.length === 0 ? (
            <div className="p-6 flex flex-col items-center justify-center col-span-full">
              <img
                src={no_image}
                alt="No Subcategories"
                className="w-24 h-24 mb-4"
              />
              <p className="text-gray-600 text-lg font-semibold">
                No Subcategories Found
              </p>
            </div>
          ) : (
            subcategories.map((subcategory, idx) => {
              const isExpanded = expandedSubcategories[subcategory?.subCategoryName];
              const superSubcategories = subcategory?.superSubcategories || [];
              const visibleSuperSubcategories = isExpanded
                ? superSubcategories
                : superSubcategories.slice(0, 5);

              return (
                <div
                  key={idx}
                  className="border border-gray-200 flex flex-col md:flex-row rounded-lg shadow-lg p-4 bg-white hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex-shrink-0 w-full md:w-1/3">
                    <img
                      src={
                        subcategory?.subCategoryImage && subcategory.subCategoryImage !== ""
                          ? subcategory.subCategoryImage
                          : no_image
                      }
                      alt={subcategory?.subCategoryName || "Subcategory"}
                      className="w-full h-40 object-cover rounded-md mb-4 flex-shrink-0"
                    />
                  </div>

                  <div className="flex-1 md:pl-4">
                    {/* Subcategory Title */}
                    <h3 className="text-lg font-bold text-[#0c1f4d] mb-2 capitalize">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            to={
                              country
                                ? `/subcategory-detail/${country}/${subcategory?.subCategoryName
                                    ?.toLowerCase()
                                    .replace(/\s+/g, "-")}`
                                : `/subcategory-detail/${subcategory?.subCategoryName
                                    ?.toLowerCase()
                                    .replace(/\s+/g, "-")}`
                            }
                            className="hover:underline block w-full overflow-hidden whitespace-nowrap cursor-pointer text-ellipsis"
                          >
                            {subcategory?.subCategoryName?.length > 12
                              ? subcategory.subCategoryName.slice(0, 36) + "..."
                              : subcategory?.subCategoryName?.replace(/-/g, " ") || "Subcategory"}
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{subcategory?.subCategoryName?.replace(/-/g, " ") || "Subcategory"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </h3>

                    {/* Super Subcategories */}
                    {superSubcategories.length > 0 ? (
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {visibleSuperSubcategories.map((ssc, sscIdx) => (
                          <li key={sscIdx}>
                            <Link
                              to={`/products/${subcategory?.subCategoryName
                                ?.toLowerCase()
                                .replace(/\s+/g, "-")}/${ssc?.superSubCategoryName
                                ?.toLowerCase()
                                .replace(/\s+/g, "-")}`}
                              className="hover:underline"
                            >
                              {ssc?.superSubCategoryName?.replace(/-/g, " ") ||
                                "Super Subcategory"}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-600 text-sm">No record found</p>
                    )}

                    {/* Toggle Explore More / Show Less */}
                    {superSubcategories.length > 5 && (
                      <button
                        onClick={() =>
                          toggleExpand(subcategory?.subCategoryName)
                        }
                        className="mt-2 text-blue-600 hover:underline text-sm"
                        aria-label={
                          isExpanded
                            ? "Show less subcategories"
                            : "Explore more subcategories"
                        }
                      >
                        {isExpanded ? "- Show Less" : "+ Explore More"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </TooltipProvider>

      {/* Pagination Controls */}
      {pagination?.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8 flex-wrap">
          <button
            onClick={handlePrevPage}
            disabled={pagination?.currentPage === 1}
            className="px-4 py-2 rounded bg-gray-300 disabled:opacity-50"
          >
            Prev
          </button>

          {Array.from({ length: pagination?.totalPages || 0 }, (_, i) => i + 1).map(
            (pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageClick(pageNum)}
                className={`px-4 py-2 rounded ${
                  pageNum === currentPage
                    ? "bg-[#0c1f4d] text-white"
                    : "bg-gray-200"
                }`}
              >
                {pageNum}
              </button>
            )
          )}

          <button
            onClick={handleNextPage}
            disabled={pagination?.currentPage === pagination?.totalPages}
            className="px-4 py-2 rounded bg-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default SubCategoryList;