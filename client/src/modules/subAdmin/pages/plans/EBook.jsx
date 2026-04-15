import React from 'react';
import {useSidebar} from "@/modules/admin/hooks/useSidebar";

const EBook = () => {
  const {isSidebarOpen, toggleSidebar} = useSidebar()
  return (
   <>
    <div className={`${isSidebarOpen ? 'p-6 lg:ml-56' : 'p-4 lg:ml-16'}`}>
      welcome to e-book 
    </div>
   </>
  )
}

export default EBook;
