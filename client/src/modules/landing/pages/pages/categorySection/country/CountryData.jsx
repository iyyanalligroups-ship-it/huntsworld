import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetCountryDataQuery } from "@/redux/api/AddressApi"; // Adjust path
import { useGetCategoriesQuery } from "@/redux/api/CategoryApi"; // Added for categories
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/pagination";
import countrybg from "@/assets/images/country-bg.jpg";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import {
  FolderX,
  PackageX,
  Building2,
  ShoppingBasket,
  ArrowBigRight,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CountryData = () => {
  const { country } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetCountryDataQuery(country);
  const { data: enhancedCategories, isLoading: categoriesLoading } =
    useGetCategoriesQuery({ page: 1, limit: 10 });

  if (isLoading || categoriesLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading data: {error.message}</div>;

  const { trendingProducts, trendingSellers } = data;
  const categories = enhancedCategories?.data || [];

  const handleReadMore = (categoryId) => {
    navigate(`/country/${country}/category/${categoryId}`);
  };

  const handleCategory = (categoryName) => {
    const formattedCategoryName = categoryName.toLowerCase().replace(/\s+/g, '-');
    if (country) {
      const formattedCountry = country.toLowerCase().replace(/\s+/g, '-');
      navigate(`/all-categories/${formattedCountry}/${formattedCategoryName}`);
    } else {
      navigate(`/all-categories/${formattedCategoryName}`);
    }
  };
  const handleSubCategory = (subCategoryName) => {
    // Updated to include country parameter
    navigate(`/subcategory-detail/${country}/${subCategoryName}`);
  };


  const handleCompany = (name) => {
    const formattedCompanyName = name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/company/${formattedCompanyName}`);
  }


  const handleProduct = (productName) => {
    const formattedProductName = productName.toLowerCase().replace(/\s+/g, '-');
    navigate(`/product/${formattedProductName}`);
  }

  return (
    <div className="w-full">
      {/* Hero Section: Static image with dynamic country name */}
      <div
        className="relative w-full h-100 bg-cover bg-no-repeat bg-center"
        style={{ backgroundImage: `url(${countrybg})` }}
      >
        {/* Text container with background */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-[#0c1f4d] bg-opacity-50 px-6 py-4 rounded-lg text-center">
            <h1 className="text-4xl font-bold text-white capitalize">
              {country}
            </h1>
            <p className="text-2xl text-white mt-2">Products Marketplace</p>
          </div>
        </div>
      </div>

      {/* Trending Products Carousel */}
      <div className="mt-10">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-4 text-center text-[#0c1f4d]">
            Trending Products
          </h2>

          {trendingProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Card className="w-full max-w-md text-center shadow-md">
                <CardContent className="flex flex-col items-center p-6">
                  <PackageX className="w-12 h-12 text-gray-400 mb-3" />
                  <h3 className="text-lg font-semibold text-gray-700">
                    No Products Found
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Check back later for trending products.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Swiper
              modules={[Autoplay, Pagination]}
              autoplay={{ delay: 3000 }}
              pagination={{ clickable: true }}
              spaceBetween={8}
              slidesPerView={1}
              breakpoints={{
                640: { slidesPerView: 2, spaceBetween: 8 },
                768: { slidesPerView: 3, spaceBetween: 8 },
                1024: { slidesPerView: 4, spaceBetween: 8 },
              }}
            >
              {trendingProducts.map((item, index) => (
                <SwiperSlide key={index}>
                  <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col w-full h-64"
                    onClick={() => handleProduct(item?.product?.product_name)}
                  >
                    {/* Image */}
                    <div className="flex cursor-pointer items-center justify-center h-40 bg-gray-50">
                      <img
                        src={item.product.image || item.product.product_image[0]}
                        alt={item.product.product_name}
                        className="max-h-36 object-contain transition-transform duration-300 hover:scale-105"
                      />
                    </div>

                    {/* Product Name */}
                    <div className="px-2 py-3 text-center flex-1 flex items-center justify-center">
                      <h3 className="text-sm font-semibold text-gray-800 truncate">
                        {item.product.product_name}
                      </h3>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </div>

      {/* Trending Categories Section */}
      <div className="mt-10">
        <h2 className="text-2xl text-center  font-bold mb-4 text-[#0c1f4d]">
          Categories
        </h2>

        {categories.length === 0 ? (
          <div className="flex flex-col  items-center justify-center py-10">
            <Card className="w-full max-w-md text-center shadow-md">
              <CardContent className="flex flex-col items-center p-6">
                <FolderX className="w-12 h-12 text-gray-400 mb-3" />
                <h3 className="text-lg font-semibold text-gray-700">
                  No Categories Found
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Try again later or add new categories.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-1 p-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories
              .filter(
                (cat) =>
                  cat.categoryName !== "All Categories" &&
                  cat.subcategories?.length > 0
              )
              .map((category) => (
                <Card
                  key={category.categoryId}
                  className="overflow-hidden rounded-none flex flex-col h-60 p-0"
                >
                  {/* Label Section */}
                  <div className="bg-[#0c1f4d] bg-opacity-60 cursor-pointer text-white flex justify-between text-sm px-3 py-2">
                    <span
                      className="truncate cursor-pointer"
                      onClick={() =>
                        handleCategory(
                          category.categoryName
                            .toLowerCase()
                            .replace(/\s+/g, "-")
                        )
                      }
                    >
                      {category.categoryName}
                    </span>
                    <Badge variant="secondary" className="text-[#0c1f4d]">
                      <ShoppingBasket className="mr-1 w-4 h-4" />
                      {category.productCount} Items
                    </Badge>
                    <Minimize2 className="w-4 h-4 inline-block cursor-pointer" />
                  </div>

                  {/* Content */}
                  <div className="flex flex-row h-full">
                    {/* Left: Category Image */}
                    <div className="w-1/2 h-full p-2">
                      <img
                        src={category.categoryImage}
                        alt={category.categoryName}
                        className="w-full h-full object-cover border-2 hover:border-[#0c1f4d] rounded-none p-1"
                      />
                    </div>

                    {/* Right: Subcategories */}
                    <CardContent className="w-1/2 p-2 flex flex-col justify-between">
                      <ul className="space-y-2 text-sm text-gray-700">
                        {category.subcategories.slice(0, 5).map((sub, idx) => (
                          <li
                            key={idx}
                            className="relative group overflow-hidden cursor-pointer flex items-center gap-3"
                          >
                            <ArrowBigRight className="w-5 h-5 shrink-0 text-[#0c1f4d] group-hover:text-blue-800 transition-colors duration-300" />
                            <span
                              className="relative z-10 hover:text-white truncate"
                              onClick={() =>
                                handleSubCategory(sub?.subCategoryName)
                              }
                            >
                              {sub.subCategoryName}
                            </span>
                            <span className="absolute bottom-0 left-0 h-full w-0 bg-[#3d7e96] group-hover:w-full transition-all duration-300 ease-out brightness-110 z-0"></span>
                          </li>
                        ))}
                      </ul>

                      {category.subcategories.length > 5 && (
                        <span
                          className="mt-3 text-blue-600 hover:underline text-sm font-medium cursor-pointer"
                          onClick={() =>
                            handleCategory(
                              category.categoryName
                                .toLowerCase()
                                .replace(/\s+/g, "-")
                            )
                          }
                        >
                          Explore More
                        </span>
                      )}
                    </CardContent>
                  </div>
                </Card>
              ))}
          </div>
        )}
      </div>

      {/* Trending Sellers (Companies) Cards */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#0c1f4d]">
          Trending Companies
        </h2>

        {trendingSellers.length === 0 ? (
          <div className="flex flex-col  items-center justify-center py-10">
            <Card className="w-full max-w-md text-center shadow-md">
              <CardContent className="flex flex-col items-center p-6">
                <Building2 className="w-12 h-12 text-gray-400 mb-3" />
                <h3 className="text-lg font-semibold text-gray-700">
                  No Companies Found
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Please check back later for trending companies.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 p-3 lg:grid-cols-4 gap-6">
            {trendingSellers.map((item, index) => {
              const seller = item.seller;
              const name = seller.company_name || seller.travels_name;

              return (
                <Card
                  key={index}
                  onClick={() => handleCompany(name)}
                  className="group rounded-2xl  shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                >
                  <CardHeader className="flex items-center justify-center">
                    <img
                      src={seller.company_logo}
                      alt={name}
                      className="w-20 h-20 object-contain rounded-full border p-2 bg-white shadow-sm group-hover:scale-105 transition-transform duration-300"
                    />
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-center text-lg font-semibold group-hover:text-primary transition-colors">
                      {name}
                    </CardTitle>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CountryData;
