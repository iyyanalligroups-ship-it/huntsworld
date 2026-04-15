import React, { useEffect, useState } from "react";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import { Bell, ChevronDown, Menu, MessageSquare, Search } from "lucide-react";
import { Link } from "react-router-dom";
import MerchantBreadcrumb from "../utils/StundentBreadcrumb";
import SearchCommand from "../utils/SearchCommand";
// import NotificationBell from "@/modules/admin/utils/NotificationBell";
import { useNavigate } from "react-router-dom";

const userPhoto = "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg";

const Header = () => {
  const { toggleSidebar, isSidebarOpen } = useSidebar();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
            <button onClick={toggleSidebar} className="p-1 rounded hover:bg-gray-100">
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
          {/* <NotificationBell /> */}
          <button onClick={() => navigate("/student/chat")}>
            <MessageSquare size={18} />
          </button>
          <div className="flex items-center gap-2 cursor-pointer">
            <img
              src={userPhoto}
              alt="User profile"
              className="w-8 h-8 rounded-full border object-cover"
            />
            <Link
              to="/student/settings"
              className="hidden sm:inline text-sm font-medium hover:text-blue-600"
            >
              Harry Scofield
            </Link>
            <Link to="/student/settings">
              <ChevronDown size={16} className="text-gray-400 hover:text-blue-600" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
