import React from 'react';
import {useSidebar} from "@/modules/admin/hooks/useSidebar";

const Banners = () => {
  const {isSidebarOpen, toggleSidebar} = useSidebar();
  return (
   <>
    <div className={`${isSidebarOpen ? 'p-6 lg:ml-56' : 'p-4 lg:ml-16'}`}>
      welcome to banners 
    </div>
   </>
  )
}

export default Banners;
