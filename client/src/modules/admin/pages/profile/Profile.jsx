import React from 'react';
import {useSidebar} from "../../hooks/useSidebar";

const Profile = () => {
  const {isSidebarOpen, toggleSidebar} = useSidebar()
  return (
  <>
   <div
      className={`flex-1 p-4 transition-all duration-300 ${isSidebarOpen
          ? 'ml-1 sm:ml-64'
          : 'ml-1 sm:ml-16'
        }`}
    >
      welcome to profile
    </div>
  </>
  )
}

export default Profile;
