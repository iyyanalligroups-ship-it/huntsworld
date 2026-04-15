import React, {  useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import * as Icons from "phosphor-react";
import serviceProviderMenuItems from "../utils/MenuItem";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import easyCol from "@/assets/images/logo.png";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Sidebar = () => {
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const [openMenus, setOpenMenus] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const navigate = useNavigate();

  // Detect screen size
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reset submenu when collapsed
  useEffect(() => {
    if (!isSidebarOpen) setOpenMenus({});
  }, [isSidebarOpen]);

  const handleToggleMenu = (title) => {
    setOpenMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const handleParentClick = (item) => {
    const hasChildren = item.children && item.children.length > 0;
    if (!isSidebarOpen && !isMobile) {
      toggleSidebar();
      return;
    }
    if (hasChildren) handleToggleMenu(item.title);
  };

  const handleNavLinkClick = () => {
    if (!isSidebarOpen && !isMobile) {
      toggleSidebar();
      return;
    }
    // Close drawer after clicking link in mobile
    if (isMobile && isSidebarOpen) toggleSidebar();
  };

  const handleLogout = () => {
    // logout?.();
    navigate("/");
  };

  const renderMenuItems = (items, level = 0) => {
    return items.map((item) => {
      const hasChildren = item.children && item.children.length > 0;
      const IconComponent = Icons[item.icon] || Icons.List;

      if (item.link) {
        return (
          <li key={`${item.title}-${level}`} className={`py-1 ${level > 0 ? "pl-2" : ""}`}>
            <NavLink to={item.link} onClick={handleNavLinkClick} end className="block">
              {({ isActive }) => (
                <div
                  className={`flex items-center w-full p-3 rounded-lg transition-all duration-200 ${
                    isActive ? "bg-gray-100 text-black" : "text-white hover:bg-[#5a5a5a]"
                  }`}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          <IconComponent
                            size={18}
                            weight="duotone"
                            className={`${isActive ? "text-black" : "text-white"}`}
                          />
                        </div>
                      </TooltipTrigger>
                      {!isSidebarOpen && !isMobile && (
                        <TooltipContent side="right" className="z-[1000]">
                          {item.title}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                  <span className={`ml-3 ${!isSidebarOpen && !isMobile ? "hidden" : ""}`}>
                    {item.title}
                  </span>
                </div>
              )}
            </NavLink>

            {hasChildren && openMenus[item.title] && isSidebarOpen && (
              <ul className="ml-4 mt-1">{renderMenuItems(item.children, level + 1)}</ul>
            )}
          </li>
        );
      }

      return (
        <li key={`${item.title}-${level}`} className={`py-1 ${level > 0 ? "pl-2" : ""}`}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => handleParentClick(item)}
            className="flex items-center w-full p-3 cursor-pointer rounded-lg transition-all duration-200 text-white hover:bg-[#5a5a5a]"
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <IconComponent size={18} weight="duotone" className="text-white" />
                  </div>
                </TooltipTrigger>
                {!isSidebarOpen && !isMobile && (
                  <TooltipContent side="right" className="z-[1000]">
                    {item.title}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <span className={`ml-3 ${!isSidebarOpen && !isMobile ? "hidden" : ""}`}>
              {item.title}
            </span>
            {hasChildren && isSidebarOpen && (
              <Icons.CaretDown
                size={14}
                weight="bold"
                className={`ml-auto transform transition-transform duration-200 ${
                  openMenus[item.title] ? "rotate-180" : "rotate-0"
                }`}
              />
            )}
          </div>
          {hasChildren && openMenus[item.title] && isSidebarOpen && (
            <ul className="ml-4 mt-1">{renderMenuItems(item.children, level + 1)}</ul>
          )}
        </li>
      );
    });
  };

  return (
    <TooltipProvider>
      <>
        {/* Mobile toggle (floating) */}
        {isMobile && (
          <button
            className="fixed top-3 left-2 z-40 p-2 text-white bg-transparent rounded-md"
            onClick={toggleSidebar}
          >
            {isSidebarOpen ? (
              <Icons.ArrowCircleLeft size={22} className="text-white" weight="duotone" />
            ) : (
              <Icons.List size={22} className="text-white" weight="duotone" />
            )}
          </button>
        )}

        {/* Mobile overlay */}
        {isMobile && isSidebarOpen && (
          <div className="fixed inset-0 bg-black/40 z-30" onClick={toggleSidebar}></div>
        )}

        {/* Sidebar */}
        <div
          className={`fixed top-0 h-full z-40 bg-[#0c1f4d] text-white shadow-2xl transition-all duration-300 flex flex-col
          ${
            isMobile
              ? isSidebarOpen
                ? "left-0 w-56"
                : "-left-64 w-56"
              : isSidebarOpen
              ? "left-0 w-56"
              : "left-0 w-16"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-black/10">
            <img
              src={easyCol}
              alt="Logo"
              onClick={() => {
                navigate("/service");
                if (isMobile) toggleSidebar();
              }}
              className={`cursor-pointer ml-1 ${!isSidebarOpen && !isMobile ? "hidden" : "w-32"}`}
            />

            {/* Desktop toggle inside header */}
            {!isMobile && (
              <button
                onClick={toggleSidebar}
                className="p-1 rounded-md hover:bg-[#5a5a5a] transition"
              >
                {isSidebarOpen ? (
                  <Icons.ArrowCircleLeft size={18} className="text-white" weight="duotone" />
                ) : (
                  <Icons.List size={18} className="text-white" weight="duotone" />
                )}
              </button>
            )}
          </div>

          {/* Menu (scrollable in mobile) */}
          <nav className="flex-1 overflow-y-auto">
            <ul className="mt-4 space-y-2 px-2 py-2 flex-grow text-[14px] font-bold">
              {renderMenuItems(serviceProviderMenuItems)}
            </ul>
          </nav>

          {/* Logout */}
          <div className="flex-shrink-0 p-4 border-t border-black/20">
            <button
              onClick={handleLogout}
              className="flex items-center w-full p-3 rounded-lg hover:bg-[#5a5a5a] transition-all duration-200 text-white"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <Icons.SignOut size={18} weight="duotone" className="text-white" />
                  </div>
                </TooltipTrigger>
                {!isSidebarOpen && !isMobile && (
                  <TooltipContent side="right" className="z-[1000]">
                    Move to home page
                  </TooltipContent>
                )}
              </Tooltip>
              <span className={`ml-3 ${!isSidebarOpen && !isMobile ? "hidden" : ""}`}>
                Move to home page
              </span>
            </button>
          </div>
        </div>
      </>
    </TooltipProvider>
  );
};

export default Sidebar;