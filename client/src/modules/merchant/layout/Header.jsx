import React, { useContext, useEffect, useState } from "react";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import { Menu } from "lucide-react";
import { Link } from "react-router-dom";
import MerchantBreadcrumb from "../utils/MerchantBreadcrumb";
import SearchCommand from "../utils/SearchCommand";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import noImage from "@/assets/images/no-image.jpg";
import GlobalNotificationBell from "../pages/globalNotification/GlobalNotificationBell";

const userPhoto =
  "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg";

const MobileTruncate = ({ text }) => {
  const displayText = text || "User";
  const isLong = displayText.length > 12;
  const truncated = isLong ? `${displayText.slice(0, 10)}…` : displayText;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="font-semibold text-gray-800 text-xs sm:text-sm truncate">
            {truncated}
          </span>
        </TooltipTrigger>
        {isLong && (
          <TooltipContent
            side="bottom"
            className="max-w-xs break-words p-2"
          >
            {displayText}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

const Header = () => {
  const { toggleSidebar, isSidebarOpen } = useSidebar();
  const { user } = useContext(AuthContext);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 bg-white transition-all duration-300 ${
        scrolled ? "shadow-md py-1" : "border-b border-gray-200 py-2"
      } ${isSidebarOpen ? "lg:ml-56" : "lg:ml-16"}`}
    >
      <div className="flex items-center justify-between w-full px-3 sm:px-4 gap-2 sm:gap-4">
        {/* LEFT SECTION */}
        <div className="flex items-center flex-shrink-0 gap-1">
          <button
            onClick={toggleSidebar}
            className="lg:hidden relative group flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 text-gray-700 hover:bg-gray-100 active:scale-95 transition-all duration-200 shadow-sm border border-gray-100"
            aria-label="Toggle Menu"
          >
            <Menu
              size={20}
              className="group-hover:text-blue-600 group-active:text-blue-700 transition-colors"
            />
          </button>

          {/* Breadcrumbs */}
          <div className="hidden md:flex flex-col ml-3">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold leading-none mb-1">
              Navigation
            </span>
            <div className="font-semibold text-gray-800 truncate">
              <MerchantBreadcrumb />
            </div>
          </div>
        </div>

        {/* CENTER SECTION */}
        <div className="flex-grow cursor-pointer min-w-0 mx-2 md:max-w-xl">
          <div className="w-full cursor-pointer">
            <SearchCommand />
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center">
          <div className="mr-5">
        <GlobalNotificationBell />
       </div>
          <Link
            to="/merchant/settings"
            className="flex items-center gap-2 p-1 pl-2 border-l border-gray-100 hover:bg-gray-50 rounded-lg transition-all"
          >
            <div className="flex flex-col items-end leading-none">
              <MobileTruncate text={user?.user?.name} />
              <span className="hidden xs:block text-[10px] text-gray-500 font-medium mt-0.5">
                Merchant
              </span>
            </div>

            <div className="relative">
              <img
                src={user?.user?.profile_pic || userPhoto}
                alt="Profile"
                className="w-8 h-8 rounded-full border border-gray-200 object-cover"
                onError={(e) => {
                  e.target.src = noImage;
                }}
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
