import { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import CategorySidebar from './pages/pages/category/CategorySidebar';
import BannerCarousel from './components/BannerCarousel';
import TrendingCategory from './pages/pages/trendingCategory/TrendingCategory';
import CategorySection from './pages/pages/categorySection/CategorySection';
import Testimonial from './Testimonial';
import PopularProducts from './pages/pages/products/PopularProduct';
import { useGetTopCategoriesQuery } from '@/redux/api/CategoryApi';
import "./css/Submenu.css";
import { useGetCategoryAccessQuery } from "@/redux/api/AccessApi";
import AllProductsPage from './pages/pages/categorySection/ProductsPages/ShowProductWise';
import { AuthContext } from './context/AuthContext';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { useSelectedUser } from '../admin/context/SelectedUserContext';
import BannerPage from './pages/pages/categorySection/BannerPage';
import BannerCarouselGrocerrySeller from './pages/pages/grocerySellerRequirement/BannerCarouselGrocerySeller';
import BrandsDisplay from './pages/pages/brand/BrandsShowCase';
import CityWrapper from './pages/pages/categorySection/CityWrapper';
import GrocerySellersPage from './pages/pages/grocerySellerRequirement/GrocerySellerPage';
import { ListFilter, X, ChevronRight } from 'lucide-react';
import { motion } from "framer-motion";
import TopSellers from './pages/pages/top-listing-product/TopListingProducts';
import SEO from '@/components/SEO';

const formatName = (value) => {
  if (!value) return "";
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

// --- Submenu Component (Unchanged) ---
const Submenu = ({ subcategories }) => {
  const navigate = useNavigate();
  const validSubcategories = subcategories?.filter(subCat => subCat?.superSubCategories?.length > 0) || [];

  const handleSubCategory = (subCategoryname) => {
    navigate(`/subcategory-detail/${subCategoryname}`);
  };

  if (validSubcategories.length === 0) {
    return (
      <Card className="w-full h-full border-none shadow-none bg-transparent">
        <CardContent className="p-6 text-center text-gray-500">No data found</CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full overflow-y-auto submenu-container border-none shadow-none bg-transparent">
      <CardContent className="p-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {validSubcategories.map((subCat, index) => {
            const formattedName = formatName(subCat.subCategoryName);
            return (
              <div key={index} className="flex flex-col min-h-[150px]">
                <h3
                  className="text-sm font-bold text-primary uppercase mb-3 border-b border-gray-200 cursor-pointer pb-2 hover:text-blue-700 transition-colors"
                  onClick={() => handleSubCategory(formattedName)}
                >
                  {formattedName}
                </h3>
                <ul className="space-y-2 flex-1">
                  {subCat.superSubCategories.slice(0, 4).map((item, itemIndex) => (
                    <li key={itemIndex}>
                      <Link
                        to={`/products/super/${formatName(item.name)}`}
                        className="text-sm text-gray-600 cursor-pointer hover:text-blue-600 hover:translate-x-1 transition-all duration-200 block"
                      >
                        {formatName(item.name)}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  to={`/subcategory-detail/${formattedName}`}
                  className="text-blue-600 text-xs font-semibold mt-3 hover:underline"
                >
                  View All &rarr;
                </Link>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// --- HomePage Component ---
const HomePage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const { data: topCategoriesData, isLoading: categoriesLoading } = useGetTopCategoriesQuery();
  const categories = topCategoriesData?.data || [];

  const { data: accessData, isLoading: accessLoading } = useGetCategoryAccessQuery();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);

  // Requirements logic
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRequirements = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/grocery-seller-requirement/fetch-all-grocery-seller-requirement?page=1&limit=5&sort=-createdAt`
        );
        const sortedRequirements = response.data.data
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        setRequirements(sortedRequirements);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch requirements');
        setLoading(false);
      }
    };
    fetchRequirements();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        const toggleBtn = document.getElementById('sidebar-toggle-btn');
        if (toggleBtn && toggleBtn.contains(event.target)) return;
        setIsSidebarOpen(false);
        setHoveredCategory(null);
      }
    };
    if (isSidebarOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSidebarOpen]);

  const isCategory = accessData?.data?.is_category ?? false;
  // Replace your current loading check in HomePage.jsx with this:
  if (accessLoading || categoriesLoading) {
    return (
      <div className='bg-gray-100 min-h-screen'>
        {/* Fake banner to keep the top spacing correct */}
        <div className="relative w-full h-[124px] md:h-[400px] lg:h-[300px] bg-gray-900" />
        <div className="h-[50vh] flex items-center justify-center text-gray-500 font-semibold">
          Loading...
        </div>
      </div>
    );
  }
  return (
    <div className='bg-gray-100 min-h-screen'>
      <SEO 
        title="Home"
        description="Huntsworld is the leading Global B2B Marketplace connecting verified wholesale suppliers and bulk buyers."
        canonicalUrl="https://huntsworld.com"
      />
      <h1 className="sr-only">Huntsworld — Global B2B Marketplace for Wholesale Suppliers and Buyers</h1>

      {/* --- RESPONSIVE BANNER SECTION --- */}
      {/* Mobile: h-[164px] (Custom height as requested)
         Desktop (md/lg): h-[400px] to h-[500px] (Standard desktop banner height)
      */}
      <div className="relative w-full h-[150px] md:h-[400px] lg:h-[300px] bg-gray-900 group">

        {/* Banner Content */}
        <div className="absolute inset-0 w-full h-full z-0">
          <BannerCarousel />
        </div>

        {/* Toggle Button with fixed "X" visibility */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-[70] flex items-center outline-none"
          aria-label="Toggle Categories"
        >
          <motion.div
            initial={false}
            animate={{
              // 1. Fixed "X" position: move it to the edge of the 300px sidebar
              x: isSidebarOpen ? 300 : 0,

              // 2. Reduce size so it doesn't hide banner content
              width: isSidebarOpen ? "45px" : "32px",
              height: isSidebarOpen ? "45px" : "80px",

              borderRadius: isSidebarOpen ? "0 8px 8px 0" : "0 8px 8px 0",
              backgroundColor: isSidebarOpen ? "#e03733" : "#e03733"
            }}
            className="flex flex-col cursor-pointer items-center justify-center shadow-2xl border-y border-r border-white/20 text-white transition-all duration-300"
          >
            {isSidebarOpen ? (
              // The X is now moved 300px to the right, appearing at the edge of the sidebar
              <X size={24} strokeWidth={3} />
            ) : (
              <>
                <ListFilter size={16} className="mb-1" />
                <span className="text-[9px] font-bold uppercase [writing-mode:vertical-lr] rotate-180 tracking-tighter">
                  Categories
                </span>
              </>
            )}
          </motion.div>
        </button>
        <div
          ref={sidebarRef}
          className={`
            fixed top-0 left-0 h-screen w-[300px] z-[60] bg-white shadow-2xl
            transform transition-transform duration-300 ease-in-out pt-20 border-r border-gray-200
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="h-full overflow-y-auto custom-scrollbar">
            <CategorySidebar
              categories={categories}
              onHover={(cat) =>
                setHoveredCategory({
                  id: cat.categoryId,
                  ...cat,
                  subCategories: cat.subCategories || [],
                })
              }
              onLeave={() => { }}
              selectedId={hoveredCategory?.id}
            />
          </div>
        </div>

        {/* Submenu Flyout (Fixed next to sidebar) */}
        {isSidebarOpen && hoveredCategory?.subCategories?.length > 0 && (
          <div
            className="fixed top-0 left-[280px] h-screen w-[calc(100vw-280px)] md:w-[600px] z-[55] bg-white/95 backdrop-blur-md shadow-xl animate-in fade-in slide-in-from-left-4 duration-300 border-l border-gray-100 pt-20"
            onMouseEnter={() => setHoveredCategory(hoveredCategory)}
            onMouseLeave={() => setHoveredCategory(null)}
          >
            <div className="px-4 py-2 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center h-[50px]">
              <span className="font-bold text-lg text-[#0c1f4d]">{formatName(hoveredCategory.categoryName)}</span>
              <button onClick={() => setHoveredCategory(null)} className="text-gray-400 hover:text-red-500">
                <X size={18} />
              </button>
            </div>
            <div className="h-[calc(100%-50px)] overflow-y-auto">
              <Submenu subcategories={hoveredCategory.subCategories} />
            </div>
          </div>
        )}

        {/* Dark Overlay (Fixed full screen) */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-[50] transition-opacity duration-300 backdrop-blur-sm"
            onClick={() => { setIsSidebarOpen(false); setHoveredCategory(null); }}
          />
        )}
      </div>

      {/* --- CONTENT SECTIONS --- */}
      <div className="container mx-auto px-2 md:px-2 py-2 md:py-1">
        <div className=" md:mt-4">
          <TrendingCategory />
        </div>
        <div>
          <TopSellers />
        </div>
        <div className="mt-4"><PopularProducts /></div>
        <div className="mt-4">
          {isCategory ? <AllProductsPage /> : <CategorySection categories={categories} />}
        </div>
        <div><BannerPage /></div>

        <div className="mt-4"><Testimonial /></div>
        <div>{isCategory && <CityWrapper />}</div>

        <div><BrandsDisplay /></div>
        <div><GrocerySellersPage /></div>
        {requirements.length > 0 && (
          <>
            <div className="mt-4">
              {loading ? (
                <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
              ) : error ? (
                <div className="text-center text-red-500 p-4">{error}</div>
              ) : (
                <BannerCarouselGrocerrySeller />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;
