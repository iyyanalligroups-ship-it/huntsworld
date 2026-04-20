

import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { List, ArrowCircleLeft, CaretDown, SignOut } from "phosphor-react";
import * as Icons from "phosphor-react";
import menuItems from "../utils/Menuitem";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import easyCol from "@/assets/images/logo.png";
import { AuthContext } from "@/modules/landing/context/AuthContext";

const Sidebar = () => {
  const { logout } = useContext(AuthContext);
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const [openMenus, setOpenMenus] = useState({});
  const navigate = useNavigate();
  // Toggle Submenu
  const handleToggle = (title) => {
    setOpenMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };
  const handleLinkClick = () => {
    if (window.innerWidth < 1024 && isSidebarOpen) {
      toggleSidebar(); 
    }
  };
  const handleLogout = () => {
    logout(); 
    navigate("/admin-login");
  };

  // Function to render menu items
  const renderMenuItems = (items, level = 0) => {
    return items.map((item) => {
      const IconComponent = Icons[item.icon] || Icons.List; 
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
                <IconComponent size={20} color="white" weight="duotone" />
                <span className={`ml-3 ${!isSidebarOpen ? "hidden" : ""}`}>
                  {item.title}
                </span>
              </Link>
            ) : (
              <div
                onClick={() => hasChildren && handleToggle(item.title)}
                className="flex items-center w-full"
              >
                <IconComponent size={20} color="white" weight="duotone" />
                <span className={`ml-3 ${!isSidebarOpen ? "hidden" : ""}`}>
                  {item.title}
                </span>
                {hasChildren && isSidebarOpen && (
                  <CaretDown
                    className={`ml-auto transform transition-transform duration-300 ${openMenus[item.title] ? "rotate-180" : "rotate-0"
                      }`}
                    size={18}
                    color="white"
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
      <button className="fixed top-3 left-2 z-20 p-2 text-gray-800" onClick={toggleSidebar}>
        {isSidebarOpen ? (
          <ArrowCircleLeft size={20} color="white" weight="duotone" />
        ) : (
          <List size={20} color="white" weight="duotone" />
        )}
      </button>

      {/* Sidebar Container */}
      <div
        className={`fixed top-0 left-0 h-full  backdrop-blur-md shadow-2xl border transition-all duration-300 z-10 bg-[#0c1f4d] ${isSidebarOpen ? "w-56" : "w-0 lg:w-16"
          } flex flex-col overflow-y-auto`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center p-2 border-b-1 ">

          <img src={easyCol} className={`w-32 ml-6 cursor-pointer ${!isSidebarOpen ? "hidden" : ""}`} onClick={() => navigate("/admin")} />


        </div>

        {/* Sidebar Menu */}
        <nav>
          <ul className="mt-6 space-y-2 px-2 py-2 flex-grow text-[14px] font-bold font-suse">
            {renderMenuItems(menuItems)}
          </ul>
        </nav>

        <div className="flex-shrink-0 p-4 space-y-2 px-2 py-4 text-[14px] font-bold font-suse ">
          <button
            onClick={handleLogout}
            className="flex items-center p-3 hover:bg-[#5a5a5a] rounded-lg transition-all duration-300"
          >
            <SignOut size={20} color="white" weight="duotone" />
            <span className={`ml-3 text-white ${!isSidebarOpen ? "hidden" : ""}`}>Logout</span>
          </button>
        </div>

      </div>
    </>
  );
};

export default Sidebar;

