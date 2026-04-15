
// export default Header;
import React, { useState, useEffect } from 'react';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import { Bell, ChevronDown, MessageSquare } from 'lucide-react';
// import NotificationBell from '@/modules/admin/utils/NotificationBell';
import "@/modules/admin/css/Animation.css";
import CommonUserBreadcrumb from '../utils/CommonUserBreadcrumb';
import SearchCommand from '../utils/SearchCommand';
import { Link } from 'react-router-dom';

// Temporary user photo URL
const userPhoto = "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";

const Header = () => {
  const { isSidebarOpen } = useSidebar();

  return (
    <header
      className={`sticky top-0 bg-white p-4 flex items-center justify-end ${isSidebarOpen ? "lg:ml-56" : "lg:ml-16"
        } space-x-4 z-10`}
    >
      {/* Logo or Brand */}
      <div className='w-full flex justify-between'>
        <div className="text-xl font-semibold">  <CommonUserBreadcrumb /></div>
        <div>
          <SearchCommand />
        </div>
        {/* Right side elements */}
        <div className="flex items-center space-x-6">
          {/* Notification Bell */}
          {/* <NotificationBell /> */}
          <Link to="/admin/chat" className="relative group">
            <MessageSquare className="relative p-1 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none" />
            <span className="sr-only">Messages</span>
          </Link>
          {/* User Profile */}
          <div className="flex items-center gap-2 cursor-pointer group">
            <img
              className="w-8 h-8 rounded-full object-cover border border-gray-200"
              src={userPhoto}
              alt="User profile"
            />
         <Link to="/admin/settings">
         <span className="font-medium text-sm hidden sm:inline group-hover:text-blue-600 transition-colors">
              Harry Scofield
            </span>
         </Link>
         <Link to="/admin/settings">
         <ChevronDown size={16}  className="text-gray-400 group-hover:text-blue-600 transition-colors" /></Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
