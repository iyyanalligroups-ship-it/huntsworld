import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBasket,
  ArrowBigRight,
  Minimize2,
  ChevronDown,
  ArrowLeft
} from "lucide-react";
import { useGetCategoriesQuery } from "@/redux/api/CategoryApi";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import no_image from "@/assets/images/no-image.jpg";

const AllCategoriesPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const limit = 10;
  const [search, setSearch] = useState("");
  const [visibleSubcategories, setVisibleSubcategories] = useState({});
  const [allCategories, setAllCategories] = useState([]);

  const { data: enhancedCategories, isLoading, isFetching } =
    useGetCategoriesQuery({
      page,
      limit,
      search,
    });

  useEffect(() => {
    if (enhancedCategories?.data && !isLoading) {
      setAllCategories((prev) => {
        const newCategories = enhancedCategories.data.filter(
          (newCat) => !prev.some((cat) => cat.categoryId === newCat.categoryId)
        );
        return [...prev, ...newCategories];
      });
    }
  }, [enhancedCategories, isLoading]);

  const pagination = enhancedCategories?.pagination || {};
  const hasMoreCategories = page < pagination.totalPages;

  const handleCategory = (categoryName) => {
    navigate(`/all-categories/${categoryName.toLowerCase().replace(/\s+/g, "-")}`);
  };

  const handleSubCategory = (subCategoryName) => {
    navigate(`/subcategory-detail/${subCategoryName.toLowerCase().replace(/\s+/g, "-")}`);
  };

  const toggleSubcategories = (categoryId) => {
    setVisibleSubcategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const loadMoreCategories = () => {
    if (!isFetching) setPage((prev) => prev + 1);
  };

  if (isLoading && page === 1) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0c1f4d]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen relative">
      <Button
        type="button"
        onClick={() => navigate(-1)}
        variant="outline"
        className="absolute cursor-pointer top-5 left-5 z-40 flex gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-lg p-6 mt-10 mb-8 shadow-sm"
      >
        <h2 className="text-3xl font-bold mb-3 text-[#0c1f4d]"> Market for Products </h2>
        <p className="text-gray-600 max-w-4xl leading-relaxed">
          Explore India's largest B2B trade junction. Browse through various categories,
          send inquiries, and find exactly what your business needs with a single click.
        </p>
      </motion.div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {allCategories
            .filter((cat) => cat.categoryName !== "All Categories")
            .map((category) => {
              const isVisible = visibleSubcategories[category.categoryId] || false;
              const subCount = category.subcategories?.length || 0;
              const displayedSubcategories = isVisible
                ? category.subcategories
                : category.subcategories.slice(0, 5);

              return (
                <motion.div
                  key={category.categoryId}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="flex flex-col h-full overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 group">
                    {/* Category Header Label */}
                    <div className="bg-[#0c1f4d] p-3 flex justify-between items-center text-white">
                      <span
                        className="font-semibold truncate cursor-pointer hover:underline text-sm"
                        onClick={() => handleCategory(category.categoryName)}
                      >
                        {category.categoryName}
                      </span>
                      <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 border-none text-white text-[10px] flex gap-1">
                        <ShoppingBasket className="w-3 h-3" />
                        {category.productCount}
                      </Badge>
                    </div>

                    {/* Card Body */}
                    <div className="flex flex-row flex-grow bg-white">
                      {/* Left: Image */}
                      <div className="w-2/5 relative overflow-hidden bg-gray-100">
                        <img
                          src={category.categoryImage || no_image}
                          alt={category.categoryName}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => (e.target.src = no_image)}
                        />
                      </div>

                      {/* Right: Subcategories */}
                      <CardContent className="w-3/5 p-3 flex flex-col justify-between">
                        <div>
                          {subCount > 0 ? (
                            <ul className="space-y-1.5">
                              {displayedSubcategories.map((sub, idx) => (
                                <li
                                  key={idx}
                                  onClick={() => handleSubCategory(sub.subCategoryName)}
                                  className="flex items-center gap-2 text-xs text-gray-600 hover:text-[#0c1f4d] cursor-pointer transition-colors"
                                >
                                  <ArrowBigRight className="w-3 h-3 text-[#0c1f4d] shrink-0" />
                                  <span className="truncate">{sub.subCategoryName}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-gray-400 italic">No subcategories</p>
                          )}

                          {subCount > 5 && (
                            <button
                              onClick={() => toggleSubcategories(category.categoryId)}
                              className="mt-2 text-[#0c1f4d] text-[11px] font-bold flex items-center gap-1 hover:opacity-80 transition-opacity"
                            >
                              {isVisible ? "SHOW LESS" : "SHOW MORE"}
                              <ChevronDown className={`w-3 h-3 transition-transform ${isVisible ? "rotate-180" : ""}`} />
                            </button>
                          )}
                        </div>

                        {/* Logic: Show Explore More only if subcategories >= 4 */}
                        {subCount >= 4 && (
                          <Link
                            to={`/all-categories/${category.categoryName.toLowerCase().replace(/\s+/g, "-")}`}
                            className="mt-4 pt-2 border-t border-gray-100 text-[#0c1f4d] hover:text-blue-700 text-xs font-bold block"
                          >
                            EXPLORE MORE →
                          </Link>
                        )}
                      </CardContent>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
        </AnimatePresence>
      </div>

      {/* Load More Button */}
      {hasMoreCategories && (
        <div className="mt-12 flex justify-center">
          <Button
            onClick={loadMoreCategories}
            disabled={isFetching}
            className="bg-[#0c1f4d] hover:bg-[#162e6e] text-white px-8 py-2 rounded-full shadow-lg transition-all"
          >
            {isFetching ? "Loading..." : "View More Categories"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AllCategoriesPage;
