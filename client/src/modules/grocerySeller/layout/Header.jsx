import React, { useState, useEffect, useContext } from 'react';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import GrocerySearchCommand from '../utils/SearchCommand';
import GrocerySellerBreadcrumb from '../utils/GrocerrySellerBreadcrumb';
import noImage from "@/assets/images/no-image.jpg";

const userPhoto = "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg";

const Header = () => {
  const { user } = useContext(AuthContext);
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 bg-white transition-all duration-200 ${scrolled ? 'shadow-md py-2' : 'border-b border-gray-200 py-3'
        } ${isSidebarOpen ? 'lg:ml-56' : 'lg:ml-16'}`}
    >
      <div className="px-3 w-full flex items-center justify-between gap-2 sm:gap-4">

        {/* LEFT SECTION: Improved Sidebar Toggle & Breadcrumbs */}
        <div className="flex items-center flex-shrink-0 gap-1">
          <button
            onClick={toggleSidebar}
            className="lg:hidden relative group flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 text-gray-700 hover:bg-gray-100 active:scale-95 transition-all duration-200 shadow-sm border border-gray-100"
            aria-label="Toggle Menu"
          >
            {/* Subtle animation: the menu icon shifts slightly on hover/active */}
            <Menu
              size={20}
              className="group-hover:text-blue-600 group-active:text-blue-700 transition-colors"
            />

    
          </button>

          {/* Breadcrumbs - Only visible on Tablet/Desktop */}
          <div className="hidden md:flex flex-col ml-3">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold leading-none mb-1">
              Navigation
            </span>
            <div className="font-semibold text-gray-800 truncate max-w-[150px] lg:max-w-[250px]">
              <GrocerySellerBreadcrumb />
            </div>
          </div>
        </div>

        {/* CENTER SECTION: Search Bar */}
        {/* 'flex-1' allows it to grow/shrink. 'min-w-[120px]' prevents it from disappearing. */}
        {/* CENTER SECTION: Search Bar */}
        <div className="flex-grow cursor-pointer min-w-0 mx-2 md:max-w-xl">
          <div className="w-full cursor-pointer">
            <GrocerySearchCommand />
          </div>
        </div>

        {/* RIGHT SECTION: Notifications & Profile */}
        <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">



          {/* Profile Section */}
          <Link
            to="/baseMember/settings"
            className="flex items-center gap-2 pl-2 border-l border-gray-100 hover:bg-gray-50 rounded-r-lg transition-all"
          >
            <div className="relative flex-shrink-0">
              <img
                src={user?.user?.profile_pic || userPhoto}
                alt="User Profile"
                className="w-8 h-8 rounded-full object-cover border border-gray-300 ring-2 ring-transparent group-hover:ring-blue-50"
                onError={(e) => {
                  if (e.currentTarget.src !== noImage) {
                    e.currentTarget.src = noImage;
                  }
                }}
              />
            </div>

            {/* USER NAME: Always visible on mobile */}
            {/* - text-xs: smaller font for mobile
                - truncate: adds "..." if name is too long
                - max-w-[60px]: caps the width on very small phones
                - xs:max-w-[100px]: allows more room on medium phones
            */}
            <div className="flex flex-col items-start leading-none">
              <span className="text-xs sm:text-sm font-bold text-gray-900 truncate max-w-[60px] xs:max-w-[90px] md:max-w-[150px]">
                {user?.user?.name || "Guest"}
              </span>
              <span className="hidden xs:block text-[10px] text-gray-500 font-medium">
                Member
              </span>
            </div>
          </Link>

        </div>
      </div>
    </header>
  );
};

export default Header;
