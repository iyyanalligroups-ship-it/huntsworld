import React, { useState, useEffect, useContext } from 'react';
import { Menu, Bell, ChevronDown, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminBreadcrumb from '../utils/AdminBreadcrumb';
import SearchCommand from '../utils/SearchCommand';
import CouponNotificationBell from '../utils/CouponNotificationBell';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { useSidebar } from '../hooks/useSidebar';
import { useUnreadCount } from '../context/UnreadCountContext';
import Badge from '../pages/chat/components/helper/Badge';

const Header = () => {
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const { user } = useContext(AuthContext);
  const { totalUnread } = useUnreadCount();
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
            <div className="relative cursor-pointer" onClick={() => navigate("/admin/chat")}>
              <MessageSquare size={24} />
              <Badge count={totalUnread} />
            </div>
            <img
              className="w-8 h-8 rounded-full object-cover border border-gray-200"
              src={user?.user?.profile_pic || userPhoto}
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
            <AccessRequestNotificationBell />
            <Link to="/admin/chat" className="relative group">
              <MessageSquare className="p-1 rounded-full hover:bg-gray-100" />
              <Badge count={totalUnread} />
            </Link>
            <div className="flex items-center gap-2">
              <img
                className="w-8 h-8 rounded-full object-cover border border-gray-200"
                src={userPhoto}
                alt="User"
              />
              <Link to="/admin/settings" className="text-sm font-medium hover:text-blue-600">
                Harry Scofield
              </Link>
              <ChevronDown size={16} className="text-gray-400" />
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
