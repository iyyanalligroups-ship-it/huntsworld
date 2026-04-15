import React, { useContext, useEffect, useState } from "react";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import { Bell, ChevronDown, Menu, MessageSquare, Search } from "lucide-react";
import { Link } from "react-router-dom";
import MerchantBreadcrumb from "../utils/ServiceProviderBreadcrumb";
import SearchCommand from "../utils/SearchCommand";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import GlobalNotificationBell from "../pages/globalNotification/GlobalNotificationBell";

const userPhoto =
  "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg";

const Header = () => {
  const { toggleSidebar, isSidebarOpen } = useSidebar();
  const { user } = useContext(AuthContext);
  // console.log(user,'mercahnt user');

  const userId = user?.user?._id;
  console.log(user, "usere kdnfkjdfn");

  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  const MobileTruncate = ({ text }) => {
  const displayText = text || "N/A";
  const isLong = displayText.length > 20;
  const truncated = isLong ? `${displayText.slice(0, 20)}…` : displayText;

  return isLong ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="font-normal cursor-default text-gray-700">
            {truncated}
          </span>
        </TooltipTrigger>

        <TooltipContent side="top" className="max-w-xs break-words p-2">
          {displayText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <span className="font-normal text-gray-700">{displayText}</span>
  );
};

  return (
    <header
      className={`sticky top-0 z-30  bg-white border-b 
      transition-shadow duration-300 ${scrolled ? "shadow-sm" : ""}
      ${isSidebarOpen ? "lg:ml-56" : "lg:ml-16"}`}
    >
      <div className="flex items-center justify-between px-4 py-2 gap-3">
        {/* LEFT SECTION */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Toggle and Search icon - Mobile only */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleSidebar}
              className="p-1 rounded hover:bg-gray-100"
            >
              <Menu size={20} />
            </button>
            <button className="p-1 rounded hover:bg-gray-100">
              <Search size={20} />
            </button>
          </div>

          {/* Breadcrumb - Desktop only */}
          <div className="hidden md:block font-medium text-gray-800 truncate">
            <MerchantBreadcrumb />
          </div>
        </div>

        {/* CENTER - Search bar (Desktop only) */}
        <div className="hidden md:flex flex-1 justify-center">
          <div className="w-full max-w-md">
            <SearchCommand />
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-4">
          <GlobalNotificationBell />
          <button onClick={() => navigate("/service/service-chat")}>
            <MessageSquare size={18} />
          </button>
          <div className="flex items-center gap-2 cursor-pointer">
            <img
              src={user?.user?.profile_pic || userPhoto}
              alt="User profile"
              className="w-8 h-8 rounded-full border object-cover"
              onError={(e) => {
                e.target.onerror = null; // Prevent infinite loop
                e.target.src = userPhoto;
              }}
            />

            <Link
              to="/service/settings"
              className="hidden sm:inline text-sm font-medium hover:text-blue-600"
            >
              {user?.user?.name}
            </Link>
            <Link to="/service/settings">
              <ChevronDown
                size={16}
                className="text-gray-400 hover:text-blue-600"
              />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
