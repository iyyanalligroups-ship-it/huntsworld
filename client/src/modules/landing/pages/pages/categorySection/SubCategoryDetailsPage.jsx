import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetSubCategoryByNameQuery,
  useGetSubCategoryByCountryNameQuery,
} from "@/redux/api/CategoryApi";
import { FolderX, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";


const ITEMS_PER_PAGE = 10;

const SubCategoryDetail = () => {
  const { subcategoryName, country } = useParams();
  const [currentPageStates, setCurrentPageStates] = useState({});
  const navigate = useNavigate();

  // Define query params
  const queryParams = {
    sub_category_name: subcategoryName,
    page: 1,
    ...(country && { country }),
  };

  // Use skip option to avoid conditional hooks
  const countryQuery = useGetSubCategoryByCountryNameQuery(queryParams, {
    skip: !country,
  });
  const normalQuery = useGetSubCategoryByNameQuery(queryParams, {
    skip: !!country,
  });

  // Decide which query result to use
  const queryResult = country ? countryQuery : normalQuery;
  const { data: subCategoryData, isLoading, error, refetch } = queryResult;

  // Debug
  useEffect(() => {
    console.log("subCategoryData:", JSON.stringify(subCategoryData, null, 2));
    console.log("country:", country, "subcategoryName:", subcategoryName);
  }, [subCategoryData, country, subcategoryName]);

  // Refetch when params change
  useEffect(() => {
    refetch();
  }, [country, subcategoryName, refetch]);

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
        <span className="ml-2 text-gray-700">Loading...</span>
      </div>
    );
  }

  if (error || !subCategoryData?.data?.[0]) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="p-6 flex flex-col items-center justify-center"
      >
        <FolderX className="w-16 h-16 text-gray-400 mb-4" />
        <p className="text-gray-600 text-lg font-semibold">No Subcategory Found</p>
      </motion.div>
    );
  }

  // Extract first subcategory
  const selectedSub = subCategoryData.data[0];
  // Ensure superSubcategories is an array
  const superSubcategories = Array.isArray(selectedSub.superSubcategories)
    ? selectedSub.superSubcategories
    : [];

  // Handle pagination
  const handlePageChange = (sscIndex, newPage) => {
    setCurrentPageStates((prev) => ({
      ...prev,
      [sscIndex]: newPage,
    }));
  };

  // Handle product navigation with animation
  const handleNavigateProduct = ({
    type,
    subCategoryName,
    superSubCategoryName,
    deepSubCategoryName,
  }) => {
    const formattedSubCategory = subCategoryName.toLowerCase().replace(/\s+/g, "-");
    const formattedSuperSubCategory = superSubCategoryName.toLowerCase().replace(/\s+/g, "-");
    const formattedDeepSubCategory = deepSubCategoryName?.toLowerCase().replace(/\s+/g, "-");

    const element = document.querySelector(`[data-name="${formattedDeepSubCategory || formattedSuperSubCategory}"]`);
    if (element) {
      element.style.transform = "scale(1.1)";
      setTimeout(() => {
        if (type === "super") {
          navigate(`/products/${type}/${formattedSuperSubCategory}`);
        } else if (type === "deep") {
          navigate(`/products/${type}/${formattedDeepSubCategory}`);
        }
      }, 150);
      setTimeout(() => {
        element.style.transform = "scale(1)";
      }, 300);
    } else {
      if (type === "super") {
        navigate(`/products/${type}/${formattedSuperSubCategory}`);
      } else if (type === "deep") {
        navigate(`/products/${type}/${formattedDeepSubCategory}`);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="p-6 relative"
    >

      <Button
        type="button"
        onClick={() => navigate(-1)}
        variant="outline"
        className="absolute cursor-pointer top-2 left-10 z-40 flex gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>
      {/* Display Subcategory Name */}
      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="w-fit mt-10 font-bold mb-4 border-l-4 border-[#0c1f4d] text-[#0c1f4d] capitalize bg-gray-50 px-4 py-2 shadow-sm"
      >
        {selectedSub.subCategoryName.replace(/-/g, " ")}
      </motion.h2>

      <div className="flex flex-col gap-6">
        {superSubcategories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="p-6 flex flex-col items-center justify-center"
          >
            <FolderX className="w-16 h-16 text-gray-400 mb-4" />
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="text-2xl font-bold text-gray-700"
            >
              Oops! No Super Subcategories Found
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="text-gray-500 text-base"
            >
              It looks like there are no super subcategories available for this subcategory.
            </motion.p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {superSubcategories.map((ssc, sscIndex) => {
              const currentPage = currentPageStates[sscIndex] || 1;
              const deepSubcategories = Array.isArray(ssc?.deepSubcategories)
                ? ssc.deepSubcategories
                : [];
              const validDeepSubcategories = deepSubcategories?.filter(
                (deepSub) =>
                  deepSub?.deepSubCategoryName &&
                  typeof deepSub.deepSubCategoryName === "string"
              );
              const totalItems = validDeepSubcategories?.length;
              const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

              const paginatedItems = validDeepSubcategories?.slice(
                (currentPage - 1) * ITEMS_PER_PAGE,
                currentPage * ITEMS_PER_PAGE
              );

              return (
                <motion.div
                  key={sscIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: sscIndex * 0.1 }}
                  className="bg-gradient-to-tr from-white to-gray-100 shadow-xl rounded-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
                >
                  <div className="p-4 space-y-3">
                    {/* Super Subcategory Name */}
                    <motion.h3
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-xl font-semibold border-b-2 w-fit cursor-pointer border-[#0c1f4d] text-gray-800"
                      onClick={() =>
                        handleNavigateProduct({
                          type: "super",
                          subCategoryName: selectedSub?.subCategoryName,
                          superSubCategoryName: ssc?.superSubCategoryName,
                        })
                      }
                    >
                      {ssc?.superSubCategoryName?.replace(/-/g, " ")}
                    </motion.h3>

                    {/* Deep Subcategories */}
                    {totalItems === 0 ? (
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-gray-500 text-sm"
                      >
                        No deep subcategories available.
                      </motion.p>
                    ) : (
                      <>
                        <ul className="space-y-1 text-sm flex gap-10 flex-wrap">
                          {paginatedItems?.map((item, idx) => (
                            <motion.li
                              key={idx}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3 }}
                              className="flex items-center gap-2"
                            >
                              <div
                                data-name={item?.deepSubCategoryName.toLowerCase().replace(/\s+/g, "-")}
                                className="flex flex-col items-center gap-2 hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                                onClick={() =>
                                  handleNavigateProduct({
                                    type: "deep",
                                    subCategoryName: selectedSub?.subCategoryName,
                                    superSubCategoryName: ssc?.superSubCategoryName,
                                    deepSubCategoryName: item?.deepSubCategoryName,
                                  })
                                }
                              >
                                <img
                                  src={
                                    item?.deepSubCategoryImage ||
                                    "https://via.placeholder.com/120"
                                  }
                                  alt={item?.deepSubCategoryName}
                                  className="w-30 h-30 rounded object-cover"
                                />
                                <span className="text-bold">
                                  {item?.deepSubCategoryName?.replace(/-/g, " ")}
                                </span>{" "}
                                ({item?.productCount})
                              </div>
                            </motion.li>
                          ))}
                        </ul>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                          <div className="flex justify-center items-center gap-2 pt-3">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() =>
                                handlePageChange(
                                  sscIndex,
                                  Math.max(currentPage - 1, 1)
                                )
                              }
                              disabled={currentPage === 1}
                              className="text-xs px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              Prev
                            </motion.button>

                            {[...Array(totalPages)].map((_, i) => (
                              <motion.button
                                key={i}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handlePageChange(sscIndex, i + 1)}
                                className={`text-xs px-2 py-1 rounded ${currentPage === i + 1
                                    ? "bg-gray-800 text-white"
                                    : "bg-gray-200"
                                  }`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.2, delay: i * 0.05 }}
                              >
                                {i + 1}
                              </motion.button>
                            ))}

                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() =>
                                handlePageChange(
                                  sscIndex,
                                  Math.min(currentPage + 1, totalPages)
                                )
                              }
                              disabled={currentPage === totalPages}
                              className="text-xs px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              Next
                            </motion.button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};

export default SubCategoryDetail;
