import React, { useEffect, useState, useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import * as Icons from "phosphor-react";
import menuItems from "../utils/MenuItem";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import easyCol from "@/assets/images/logo.png";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Store } from "lucide-react";
import { useMerchantNotificationSocket } from "../utils/useMerchantNotificationSocket";

const Sidebar = () => {

  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const { user } = useContext(AuthContext);
  const [openMenus, setOpenMenus] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const navigate = useNavigate();
  const [merchantData, setMerchantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { unreadCounts } = useMerchantNotificationSocket();


  const fetchMerchantDetails = async () => {
    try {
      const url = `${import.meta.env.VITE_API_URL}/merchants/fetch-merchant-by-user-id?userId=${user?.user?._id}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        },
      });
      console.log('fetchMerchantDetails Response Status:', response.status, response.statusText);
      const text = await response.text();
      console.log('fetchMerchantDetails Response Body:', text);
      const data = text ? JSON.parse(text) : {};
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch merchant details');
      }
      setMerchantData(data.data);
      console.log(data?.data, 'merchant details');

      setLoading(false);
    } catch (err) {
      console.error('fetchMerchantDetails Error:', err);
      setError(err.message);
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchMerchantDetails()
  }, [user])

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

  const getUnreadBadge = (item) => {
    if (!item) return null;
    let count = 0;
    let isGlobal = false;

    // Global aggregate counts for parent items
    if (item.title === "Requirement List") {
      count = (unreadCounts.askPrice || 0) + (unreadCounts.distributor || 0);
      isGlobal = true;
    } else if (item.title === "Ask Price leads") {
      count = unreadCounts.askPrice || 0;
    } else if (item.title === "Distribution Units") {
      count = unreadCounts.distributor || 0;
    }

    if (count > 0) {
      return (
        <span
          className={`absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-md z-10 ${isGlobal ? "animate-pulse" : ""}`}
        >
          {count > 99 ? "99+" : count}
        </span>
      );
    }
    return null;
  };

  const renderMenuItems = (items, level = 0) => {
    return items.map((item) => {
      const hasChildren = item.children && item.children.length > 0;
      const IconComponent = Icons[item.icon] || Icons.List;
      const badge = getUnreadBadge(item);

      if (item.link) {
        return (
          <li key={`${item.title}-${level}`} className={`py-1 ${level > 0 ? "pl-2" : ""}`}>
            <NavLink to={item.link} onClick={handleNavLinkClick} end className="block">
              {({ isActive }) => (
                <div
                  className={`flex items-center w-full p-3 rounded-lg transition-all duration-200 relative ${isActive ? "bg-gray-100 text-black" : "text-white hover:bg-[#5a5a5a]"
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
                  {badge}
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
            className="flex items-center w-full p-3 cursor-pointer rounded-lg transition-all duration-200 text-white hover:bg-[#5a5a5a] relative"
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
            {badge}
            {hasChildren && isSidebarOpen && (
              <Icons.CaretDown
                size={14}
                weight="bold"
                className={`ml-auto transform transition-transform duration-200 ${openMenus[item.title] ? "rotate-180" : "rotate-0"
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
          ${isMobile
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
                navigate("/merchant");
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
          <div className={`cursor-pointer ml-1 ${!isSidebarOpen && !isMobile ? "hidden" : "w-full"}`}>
          <div className="mx-3 mt-4 mb-6 p-3 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md shadow-lg">
            <div className="flex items-center gap-3">
              {/* Icon Box */}
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-md">
                <Store size={20} />
              </div>

              {/* Text Section */}
              <div className="flex flex-col overflow-hidden">
                <span className="text-[10px] uppercase tracking-wider text-blue-200 font-semibold">
                  Seller Account
                </span>
                <h2 className="text-base font-bold text-white truncate capitalize tracking-wide">
                  {merchantData?.company_name || "Company Name"}
                </h2>
              </div>
            </div>
          </div>
          </div>
          {/* Menu (scrollable in mobile) */}
          <nav className="flex-1 overflow-y-auto sidebar-scrollbar">
            <ul className="mt-4 space-y-2 px-2 py-2 flex-grow text-[14px] font-bold">
              {renderMenuItems(menuItems)}
            </ul>
          </nav>

          {/* Logout */}
          <div className="flex-shrink-0 p-4 border-t border-black/20">
            <button
              onClick={handleLogout}
              className="flex items-center cursor-pointer w-full p-3 rounded-lg hover:bg-[#5a5a5a] transition-all duration-200 text-white"
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
