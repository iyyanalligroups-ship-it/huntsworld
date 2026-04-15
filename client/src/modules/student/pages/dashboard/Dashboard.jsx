import React from 'react'
import { useSidebar } from '@/modules/admin/hooks/useSidebar';  

const Dashboard = () => {
  const { isSidebarOpen } = useSidebar();
  return (
    <div className={`flex-1 p-4 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
        
        welcome to student dashboard
    </div>
  )
}

export default Dashboard;