import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  List as MenuIcon,
  ArrowLeftCircle,
  ChevronDown,
  LogOut,
} from "lucide-react"; // ✅ lucide-react icons
import * as Icons from "lucide-react"; // ✅ Unified lucide-react icon set
import menuItems from "../utils/MenuItem";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
// import bird from "@/assets/images/bird.png";
// import easyCol from "@/assets/images/merchant-expo-logo.png";

const Sidebar = () => {
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const [openMenus, setOpenMenus] = useState({});

  const handleToggle = (title) => {
    setOpenMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };
  const handleLinkClick = () => {
    if (window.innerWidth < 1024 && isSidebarOpen) {
      toggleSidebar(); // Close sidebar on mobile
    }
  };

  const renderMenuItems = (items, level = 0) => {
    return items.map((item) => {
      const IconComponent = Icons[item.icon] || Icons.LayoutDashboard;
      const hasChildren = item.children && item.children.length > 0;

      
    return (
      <li key={item.title} className={`py-1 ${level > 0 ? "pl-4" : ""}`}>
        <div className="flex items-center p-3 cursor-pointer text-white hover:bg-[#5a5a5a] rounded-lg transition-all duration-300">
          {item.link ? (
            <Link
              to={item.link}
              onClick={handleLinkClick}
              className="flex items-center w-full"
            >
              <IconComponent size={20} color="#f6d32f" weight="duotone" />
              <span className={`ml-3 ${!isSidebarOpen ? "hidden" : ""}`}>
                {item.title}
              </span>
            </Link>
          ) : (
            <div
              onClick={() => hasChildren && handleToggle(item.title)}
              className="flex items-center w-full"
            >
              <IconComponent size={20} color="#f6d32f" weight="duotone" />
              <span className={`ml-3 ${!isSidebarOpen ? "hidden" : ""}`}>
                {item.title}
              </span>
              {hasChildren && isSidebarOpen && (
                <CaretDown
                  className={`ml-auto transform transition-transform duration-300 ${
                    openMenus[item.title] ? "rotate-180" : "rotate-0"
                  }`}
                  size={18}
                  color="#f6d32f"
                  weight="bold"
                />
              )}
            </div>
          )}
        </div>

        {hasChildren && openMenus[item.title] && isSidebarOpen && (
          <ul className="ml-4">{renderMenuItems(item.children, level + 1)}</ul>
        )}
      </li>
    );
    });
  };

  return (
    <>
      {/* Sidebar Toggle Button */}
      <button
        className="fixed top-3 left-2 z-20 p-2 text-gray-800"
        onClick={toggleSidebar}
      >
        {isSidebarOpen ? (
          <ArrowLeftCircle size={20} color="#f6d32f" />
        ) : (
          <MenuIcon size={20} color="#f6d32f" />
        )}
      </button>

      {/* Sidebar Container */}
      <div
        className={`fixed top-0 left-0 h-full backdrop-blur-md shadow-2xl border transition-all duration-300 z-10 bg-[#1C1B1F] ${
          isSidebarOpen ? "w-56" : "w-0 lg:w-16"
        } flex flex-col overflow-y-auto`}
      >
        {/* Logo */}
        {/* <div className="flex items-center p-2">
          <img
            className={`w-8 h-8 md:w-10 md:h-10 ${isSidebarOpen ? "hidden" : ""}`}
            src={bird}
            alt="Logo"
          />
          <img
            src={easyCol}
            className={`w-32 ml-6 ${!isSidebarOpen ? "hidden" : ""}`}
            alt="Full Logo"
          />
        </div> */}

        {/* Sidebar Menu */}
        <nav>
          <ul className="mt-6 space-y-2 px-2 py-2 flex-grow text-[14px] font-bold font-suse">
            {renderMenuItems(menuItems)}
          </ul>
        </nav>

        {/* Logout */}
        <div className="flex-shrink-0 p-4 space-y-2 px-2 py-4 text-[14px] font-bold font-suse">
          <Link
            to="/"
            className="flex items-center p-3 hover:bg-[#5a5a5a] rounded-lg transition-all duration-300"
          >
            <LogOut size={20} color="#f6d32f" />
            <span className={`ml-3 text-white ${!isSidebarOpen ? "hidden" : ""}`}>
              Logout
            </span>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
