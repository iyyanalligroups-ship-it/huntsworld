import React from 'react'
import { useSidebar } from '@/modules/admin/hooks/useSidebar';

const Dashboard = () => {
     const { isSidebarOpen } = useSidebar();
  return (
       <div
      className={`flex-1 p-4 transition-all duration-300 ${isSidebarOpen
          ? 'ml-1 sm:ml-64'
          : 'ml-1 sm:ml-16'
        }`}
    >
      welcome to grocery seller dashboard
    </div>
  )
}

export default Dashboard;
