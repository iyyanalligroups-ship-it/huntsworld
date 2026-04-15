import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, ChevronRight } from 'lucide-react';
import CountryWrapper from './CountryWrapper';
import CityWrapper from './CityWrapper';

const CategorySection = ({ categories }) => {
  const navigate = useNavigate();

  const handleCategory = (name) => {
    const url = name?.toLowerCase()?.replace(/ & /g, '-')?.replace(/ /g, '-');
    navigate(`/all-categories/${url}`);
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 space-y-16">
      {categories
        .filter((category) => category.categoryName !== "All Categories")
        .map((category, index) => (
          <React.Fragment key={category.categoryId}>
            <section className="group">
              {/* Header: Title & "View All" link */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1.5 bg-[#0c1f4d] rounded-full"></div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                        {category.categoryName}
                    </h2>
                </div>
                <button
                  onClick={() => handleCategory(category.categoryName)}
                  className="flex items-center text-sm font-semibold text-[#0c1f4d] hover:gap-2 transition-all"
                >
                  View All Products <ChevronRight size={16} />
                </button>
              </div>

              {/* Main Content Card */}
              <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col lg:flex-row transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]">

                {/* Left: Subcategories Grid */}
                <div className="flex-1 p-6 md:p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {category?.subCategories?.slice(0, 4).map((sub) => (
                      <div
                        key={sub.subCategoryId}
                        className="group/sub border border-gray-50 rounded-2xl p-4 bg-gray-50/30 hover:bg-white hover:border-white hover:shadow-xl transition-all duration-300"
                      >
                        <div className="flex gap-4">
                          <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden shadow-sm">
                            <img
                              src={sub.subCategoryImage}
                              alt={sub.subCategoryName}
                              className="w-full h-full object-cover group-hover/sub:scale-110 transition-transform duration-500"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link to={`/subcategory-detail/${sub.subCategoryName}`}>
                              <h3 className="font-bold text-sm text-[#0c1f4d] hover:text-red-600 transition-colors truncate">
                                {sub.subCategoryName}
                              </h3>
                            </Link>
                            <div className="mt-2 space-y-1">
                                {category.categoryName.includes("Fashion") ? (
                                     <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                                        Premium quality products from verified global suppliers.
                                     </p>
                                ) : (
                                    <ul className="text-[11px] text-gray-500 space-y-1">
                                        {sub?.superSubCategories?.[0]?.deepSubCategories?.slice(0, 2).map((deep) => (
                                            <li key={deep.deepSubCategoryId} className="truncate hover:text-red-500">
                                                <Link to={`/products/deep/${deep.name}`}>• {deep.name}</Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Featured Banner Section */}
                <div
                  className="relative lg:w-1/3 min-h-[300px] cursor-pointer group/banner"
                  onClick={() => handleCategory(category.categoryName)}
                >
                  <img
                    src={category.image || "https://via.placeholder.com/600x800"}
                    alt={category.categoryName}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/banner:scale-105"
                  />
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c1f4d]/90 via-[#0c1f4d]/20 to-transparent"></div>

                  <div className="absolute bottom-0 left-0 p-8 w-full">
                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2">Featured Category</p>
                    <h2 className="text-white text-3xl font-black leading-tight mb-4">
                      {category.categoryName}
                    </h2>
                    <div className="flex items-center gap-2 text-white font-bold text-sm bg-white/10 backdrop-blur-md border border-white/20 w-fit px-4 py-2 rounded-full group-hover/banner:bg-red-600 transition-all">
                      Explore Collection <ArrowUpRight size={18} />
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* Injected Wrappers */}
            {index === 2 && (
                <div className="py-8"><CityWrapper /></div>
            )}
            {index === 7 && (
                <div className="py-8"><CountryWrapper /></div>
            )}
          </React.Fragment>
        ))}
    </div>
  );
};

export default CategorySection;
