import React, { useState, useEffect, useContext } from 'react';
import { Menu, Bell, ChevronDown, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminBreadcrumb from '@/modules/admin/utils/AdminBreadcrumb';
import SearchCommand from '../utils/SearchCommand';
// import NotificationBell from '@/modules/admin/utils/NotificationBell';
import CouponNotificationBell from '@/modules/admin/utils/CouponNotificationBell';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import {useSidebar} from "@/modules/admin/hooks/useSidebar";
import TrustSealNotificationBell from '@/modules/admin/utils/TrustSealNotificationBell';
import { useNavigate } from 'react-router-dom';


const userPhoto = "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg";

const Header = () => {
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b-2 border-solid px-4 py-3 bg-white transition-shadow duration-300
        ${scrolled ? 'shadow-md border-b border-gray-200' : ''}
        ${isSidebarOpen ? 'lg:ml-56' : 'lg:ml-16'}`}
      >
        {/* MOBILE VIEW */}
        <div className="flex sm:hidden items-center justify-between gap-3">
          {/* Sidebar Toggle */}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md border border-gray-300"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="flex-grow flex justify-center">
            <SearchCommand />
          </div>

          {/* Icons + Avatar */}
          <div className="flex items-center gap-2">
            {/* <NotificationBell /> */}
            <CouponNotificationBell userId={user?.user?._id} />
            <button onClick={() => navigate("/chat")}>
              <MessageSquare size={24} />
            </button>
            <img
              className="w-8 h-8 rounded-full object-cover border border-gray-200"
              src={userPhoto}
              alt="User"
            />
          </div>
        </div>

        {/* DESKTOP VIEW */}
        <div className="hidden sm:flex items-center justify-between w-full">
          {/* Left - Breadcrumb */}
          <div className="flex-shrink-0">
            <AdminBreadcrumb />
          </div>

          {/* Center - Search */}
          <div className="flex-grow flex justify-center">
            <SearchCommand />
          </div>

          {/* Right - Icons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* <NotificationBell /> */}
            <CouponNotificationBell userId={user?.user?._id} />
            <TrustSealNotificationBell />
            <Link to="/subAdmin/chat" className="relative group">
              <MessageSquare className="p-1 rounded-full hover:bg-gray-100" />
            </Link>
            <div className="flex items-center gap-2">
              <img
                className="w-8 h-8 rounded-full object-cover border border-gray-200"
                src={userPhoto}
                alt="User"
              />
              <Link to="/subAdmin/settings" className="text-sm font-medium hover:text-blue-600">
                Harry Scofield
              </Link>
              <ChevronDown size={16} className="text-gray-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Spacer */}
      {/* <div className="h-[90px] sm:h-[70px]"></div> */}
    </>
  );
};

export default Header;
